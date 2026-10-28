/**
 * File: probe.ts
 * Purpose: Stage 6: one GET to the authorize URL quoted by a Sourced official claim; a client-error or login-redirect response upgrades the claims that quote it to Tested. Never fails the run.
 * Exports: probeNode, PROBE_TIMEOUT_MS
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import type { CheckRecord } from "../../services/verification-log.js";
import { getDeps } from "../deps.js";
import { applyProbe } from "../evidence/labelling.js";
import { callTimeoutMs } from "../node-timing.js";
import { findAuthorizeProbe } from "../probe/find-authorize-url.js";
import { probeUrl } from "../probe/probe-url.js";
import { stageNode } from "../stage-node.js";

/** The longest the single request may take, within what the stage's time cap allows. */
export const PROBE_TIMEOUT_MS = 3_000;

export const probeNode = stageNode("probe", async (state, config) => {
  const { runId, probeEnabled } = getDeps(config);
  const log = (reason: string, extra: Record<string, unknown> = {}) =>
    logger.info("probe summary", { runId, reason, ...extra });
  if (!probeEnabled) {
    log("disabled");
    return {};
  }
  const found = state.app
    ? findAuthorizeProbe(state.claims, state.app.domain)
    : null;
  if (!state.app || !found) {
    log("no_authorize_url");
    return {};
  }

  const run = await probeUrl(found.url, state.app.domain, {
    timeoutMs: Math.min(PROBE_TIMEOUT_MS, callTimeoutMs(config, "probe")),
    signal: config.signal,
  });
  const passed = run.outcome === "passed";
  const rows: CheckRecord[] = found.claimIds.map((claimId) => ({
    claimId,
    method: "probe",
    result: passed ? "pass" : "fail",
    detail: {
      reason: run.reason,
      ...(run.status === null ? {} : { status: run.status }),
    },
    sourceUrl: found.url,
  }));
  log(run.reason, { outcome: run.outcome, status: run.status });
  return {
    probeResult: {
      url: found.url,
      outcome: run.outcome,
      status: run.status,
      reason: run.reason,
    },
    checks: [...state.checks, ...rows],
    ...(passed
      ? {
          claims: state.claims.map((claim) =>
            found.claimIds.includes(claim.id)
              ? { ...claim, label: applyProbe(claim.label, "passed") }
              : claim,
          ),
        }
      : {}),
  };
});
