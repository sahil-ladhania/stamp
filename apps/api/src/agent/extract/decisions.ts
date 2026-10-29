/**
 * File: decisions.ts
 * Purpose: The extract stage's run-ending decisions (NOT_OAUTH, NO_PUBLIC_DOCS) and which sections a retry pass redoes.
 * Exports: decideNotOauth, endOfExtract, retrySections, RETRYABLE_SECTIONS
 * Used by: agent/nodes/extract.ts
 */
import { hashUrl } from "../../utils/hash-url.js";
import { makeFailure, type AgentFailure } from "../agent-failure.js";
import { matchQuote } from "../evidence/quote-match.js";
import type { PageRecord } from "../page-record.js";
import type { Drafts } from "../state.js";
import type { DraftSectionId, SectionId, SectionOutput } from "./sections.js";

type Gates = SectionOutput<"gates"> | null;

const STAGE = 4;

/**
 * An app that uses API keys, not OAuth, is out of scope. This needs all of: the model says api_key_only,
 * its evidence quote is found word for word on an official page, and neither the steps nor the scopes
 * section found any OAuth content. An app with both OAuth and API keys is not out of scope, and "unknown"
 * never ends a run.
 */
export function decideNotOauth(
  gates: Gates,
  drafts: Drafts,
  pages: readonly PageRecord[],
): boolean {
  if (gates?.authMethod !== "api_key_only" || gates.authEvidence === null) {
    return false;
  }
  const evidence = gates.authEvidence;
  let hash: string;
  try {
    hash = hashUrl(evidence.url);
  } catch {
    return false;
  }
  const page = pages.find((candidate) => candidate.urlHash === hash);
  if (
    page?.tier !== "official" ||
    !matchQuote(evidence.quote, page.text).matched
  ) {
    return false;
  }
  return (
    drafts.steps?.status !== "drafted" && drafts.scopes?.status !== "drafted"
  );
}

/**
 * The failure that ends the run after extraction, or null to go on.
 * NO_PUBLIC_DOCS when no section found anything (the model read the pages and said unknown);
 * INTERNAL when every section failed instead, because that is our problem, not the app's.
 */
export function endOfExtract(
  gates: Gates,
  drafts: Drafts,
  pages: readonly PageRecord[],
): AgentFailure | null {
  if (decideNotOauth(gates, drafts, pages)) {
    return makeFailure(STAGE, "NOT_OAUTH");
  }
  const statuses = Object.values(drafts).map((draft) => draft?.status);
  if (gates !== null || statuses.includes("drafted")) {
    return null;
  }
  const allFailed =
    statuses.length > 0 && statuses.every((status) => status === "failed");
  return makeFailure(STAGE, allFailed ? "INTERNAL" : "NO_PUBLIC_DOCS");
}

/** Draft sections a retry pass can redo: the ones verify reports on. The gates are redone when the review gate is unknown. */
export const RETRYABLE_SECTIONS: readonly DraftSectionId[] = [
  "steps",
  "scopes",
  "requirements",
  "blockers",
  "limits",
];

/**
 * The sections to extract again for the missing ones, and whether the verdict must be redone: it points
 * into the steps and blockers by position, so it is stale when either list was replaced.
 */
export function retrySections(missing: readonly string[]): {
  sections: SectionId[];
  redoVerdict: boolean;
} {
  const drafts = RETRYABLE_SECTIONS.filter((section) =>
    missing.includes(section),
  );
  return {
    sections: missing.includes("reviewGate") ? [...drafts, "gates"] : drafts,
    redoVerdict: drafts.includes("steps") || drafts.includes("blockers"),
  };
}
