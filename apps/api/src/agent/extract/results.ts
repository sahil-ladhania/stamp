/**
 * File: results.ts
 * Purpose: Turns the section results of one extract pass into state: drafts, the gates facts, a partial flag, and one log row per section.
 * Exports: collectResults, logRows, Collected
 * Used by: agent/nodes/extract.ts
 */
import type { Drafts } from "../state.js";
import type { SectionResult } from "./section-types.js";
import type { SectionId, SectionOutput } from "./sections.js";

export type Collected = {
  drafts: Drafts;
  /** Set when the gates section ran this pass (a retry pass does not run it); null means unknown or failed. */
  gates: SectionOutput<"gates"> | null | undefined;
  /** True when a section was skipped or cut short for lack of time. */
  partial: boolean;
};

function draftOf(result: SectionResult<SectionId>): unknown {
  if (result.status === "drafted") {
    return { status: "drafted", payload: result.output };
  }
  return result.status === "unknown"
    ? { status: "unknown" }
    : { status: "failed", reason: result.reason ?? "failed" };
}

/** The drafts, gates and partial flag from one pass; sections that did not run are left out. */
export function collectResults(
  results: readonly SectionResult<SectionId>[],
): Collected {
  // One cast: each section's draft is built from its own schema's output, which the type cannot follow across a loop.
  const drafts: Record<string, unknown> = {};
  let gates: Collected["gates"];
  for (const result of results) {
    if (result.section === "gates") {
      gates =
        result.status === "drafted"
          ? (result.output as SectionOutput<"gates">)
          : null;
    } else {
      drafts[result.section] = draftOf(result);
    }
  }
  return {
    drafts: drafts as Drafts,
    gates,
    partial: results.some((result) => result.reason === "time_budget"),
  };
}

/** One plain row per section for the stage's summary log: counts, tokens and timings, never any text. */
export function logRows(
  results: readonly SectionResult<SectionId>[],
): Record<string, unknown>[] {
  return results.map((result) => ({
    section: result.section,
    status: result.status,
    reason: result.reason,
    calls: result.calls,
    repaired: result.repaired,
    durationMs: result.durationMs,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    excerptChars: result.excerptChars,
    dropped: result.dropped,
  }));
}
