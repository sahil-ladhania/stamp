/**
 * File: verify.ts
 * Purpose: Stage 5: checks every quote against its page, labels each claim, confirms conflicts, verifies the gates evidence, runs the support check (which can only downgrade) and flags sections with no Sourced claim, or an unknown review gate, for the one retry.
 * Exports: verifyNode
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import { getDeps } from "../deps.js";
import { emit } from "../emit.js";
import { indexPages } from "../extract/sanitize.js";
import { claimSlots } from "../guide/claim-slots.js";
import { callTimeoutMs } from "../node-timing.js";
import { canonicalKey } from "../search/canonical-url.js";
import { stageNode } from "../stage-node.js";
import { claimEvents } from "../verify/claim-events.js";
import { toGateFacts } from "../scoring/gate-facts.js";
import { missingSections } from "../verify/missing-sections.js";
import { applyToGates, gateItems } from "../verify/gate-judge.js";
import {
  applyToClaims,
  claimItems,
  runJudge,
} from "../verify/support-judge.js";
import { verifyClaims } from "../verify/verify-claims.js";
import { confirmConflicts } from "../verify/verify-conflicts.js";
import { verifyGates } from "../verify/verify-gates.js";

export const verifyNode = stageNode("verify", async (state, config) => {
  const pages = indexPages(state.pages);
  const conflicts = confirmConflicts(state.drafts, pages);
  // A fetched page keeps no title, so the trust checks and the support check take it from the search result.
  const titles = new Map(
    state.searchResults.map((result) => [
      canonicalKey(result.url),
      result.title,
    ]),
  );
  const titleOf = (url: string): string | undefined =>
    titles.get(canonicalKey(url));
  const byCode = verifyClaims(
    claimSlots(state.drafts),
    pages,
    conflicts.conflictedKeys,
    { titleOf },
  );
  const gatesByCode = verifyGates(state.gates, pages);

  // The support check runs on what code left Sourced, so it can only take labels away. If it cannot run,
  // the labels stay as the code set them and the guide is partial.
  const deps = getDeps(config);
  const verdicts = state.app
    ? await runJudge(
        state.app,
        [
          ...claimItems(byCode, titleOf),
          ...(gatesByCode ? gateItems(gatesByCode.gates) : []),
        ],
        {
          now: deps.now,
          deadline:
            deps.now() +
            callTimeoutMs(config, "verify", {
              retryPass: state.retryCount > 0,
            }),
          signal: config.signal,
          usage: deps.usage,
          runId: deps.runId,
        },
      )
    : new Map();
  const verified = verdicts ? applyToClaims(byCode, verdicts) : byCode;
  const gates =
    verdicts && gatesByCode
      ? { ...gatesByCode, gates: applyToGates(gatesByCode.gates, verdicts) }
      : gatesByCode;

  for (const event of claimEvents(
    verified.claims,
    verified.outcomes,
    state.claims,
  )) {
    await emit(config, event);
  }
  const missing = missingSections(verified.claims, {
    gateKnown: toGateFacts(gates?.gates ?? null).reviewGate !== "unknown",
  });
  logger.info("verify summary", {
    runId: getDeps(config).runId,
    claims: verified.claims.length,
    sourced: verified.claims.filter((c) => c.label === "sourced").length,
    conflicts: conflicts.conflicts.length,
    downgradedByCheck: verified.outcomes.filter(
      (o, i) => o.downgrade !== null && byCode.outcomes[i]?.downgrade === null,
    ).length,
    supportCheck: verdicts === null ? "skipped" : "done",
    missing,
  });
  return {
    claims: verified.claims,
    conflicts: conflicts.conflicts,
    missingSections: missing,
    gates: gates?.gates ?? null,
    checks: [...verified.checks, ...conflicts.checks, ...(gates?.checks ?? [])],
    ...(verdicts === null ? { partial: true } : {}),
  };
});
