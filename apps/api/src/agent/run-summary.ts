/**
 * File: run-summary.ts
 * Purpose: The fields about the run's result that the per-run log line adds to the usage counters: label counts, retry, probe and coverage.
 * Exports: summarizeState
 * Used by: agent/run-real-agent.ts
 */
import { countLabels } from "./label-counts.js";
import type { State } from "./state.js";

/**
 * Labels are counted from the saved guide, so the unknown claims it holds count as Uncertain; with no guide
 * (the run failed) from the claims verify produced. No page text or claim text goes into the log.
 */
export function summarizeState(state: State): Record<string, unknown> {
  const { claims, sourced, tested, uncertain } = countLabels(
    state.guide ?? state.claims,
  );
  return {
    claims,
    labels: { sourced, tested, uncertain },
    coverage: state.guide?.coverage ?? null,
    retried: state.retryCount,
    probe: state.probeResult?.outcome ?? "none",
    pagesHeld: state.pages.length,
    libraryProtected: state.libraryProtected,
  };
}
