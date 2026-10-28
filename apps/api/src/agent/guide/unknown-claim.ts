/**
 * File: unknown-claim.ts
 * Purpose: The Uncertain claim, with no sources, that stands in for something the research could not establish; its text says why.
 * Exports: makeUnknownClaim, unknownWhy, UNKNOWN_TEXT, UnknownWhy
 * Used by: agent/guide/claim-lookup.ts, agent/guide/assemble-sections.ts
 */
import type { Claim } from "@stamp/schema";

export type UnknownWhy = "not_found" | "time_budget" | "unreadable";

/** What an unknown claim says. It states what is unknown, never a guess. */
export const UNKNOWN_TEXT: Record<UnknownWhy, string> = {
  not_found: "Not found in the fetched sources.",
  time_budget: "Not researched before the time budget ran out.",
  unreadable: "Could not be read reliably from the fetched sources.",
};

/** Only an Uncertain claim may have no sources (docs/schema-design.md). */
export function makeUnknownClaim(id: string, why: UnknownWhy): Claim {
  return { id, text: UNKNOWN_TEXT[why], label: "uncertain", sources: [] };
}

type DraftStatus =
  | { status: "drafted" }
  | { status: "unknown" }
  | { status: "failed"; reason: string };

/**
 * Why a section has nothing: it never ran (the budget stopped the run before it), it ran out of time,
 * it could not be read, or its sources did not say. A drafted section's gaps are "not found".
 */
export function unknownWhy(draft: DraftStatus | undefined): UnknownWhy {
  if (draft === undefined) return "time_budget";
  if (draft.status === "failed") {
    return draft.reason === "time_budget" ? "time_budget" : "unreadable";
  }
  return "not_found";
}
