/**
 * File: verify.ts
 * Purpose: Stage 5: checks every quote against its page, labels each claim, confirms conflicts, verifies the gates evidence and flags sections with no Sourced claim for the one retry.
 * Exports: verifyNode
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import { getDeps } from "../deps.js";
import { emit } from "../emit.js";
import { indexPages } from "../extract/sanitize.js";
import { claimSlots } from "../guide/claim-slots.js";
import { stageNode } from "../stage-node.js";
import { claimEvents } from "../verify/claim-events.js";
import { toGateFacts } from "../scoring/gate-facts.js";
import { missingSections } from "../verify/missing-sections.js";
import { verifyClaims } from "../verify/verify-claims.js";
import { confirmConflicts } from "../verify/verify-conflicts.js";
import { verifyGates } from "../verify/verify-gates.js";

export const verifyNode = stageNode("verify", async (state, config) => {
  const pages = indexPages(state.pages);
  const conflicts = confirmConflicts(state.drafts, pages);
  const verified = verifyClaims(
    claimSlots(state.drafts),
    pages,
    conflicts.conflictedKeys,
  );
  const gates = verifyGates(state.gates, pages);

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
    missing,
  });
  return {
    claims: verified.claims,
    conflicts: conflicts.conflicts,
    missingSections: missing,
    gates: gates?.gates ?? null,
    checks: [...verified.checks, ...conflicts.checks, ...(gates?.checks ?? [])],
  };
});
