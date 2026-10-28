/**
 * File: conflicts.ts
 * Purpose: Confirms a model-proposed source conflict with code and picks the preferred source: official first, then newer.
 * Exports: resolveConflict, ConflictCandidate, ConflictSide, ConflictVerdict
 * Used by: agent/nodes/verify.ts
 */
import type { SourceTier } from "@stamp/schema";
import type { DraftClaim } from "../draft-claim.js";
import { normalizeText } from "../../utils/normalize-text.js";
import { normalizeUrl } from "../../utils/hash-url.js";

export type ConflictSide = {
  draft: DraftClaim;
  tier: SourceTier;
  /** Result of matchQuote against this side's page. */
  quoteMatched: boolean;
  /** Page update date when one is known; none of our fetches provide it yet. */
  updatedAt?: Date;
};

export type ConflictCandidate = {
  topic: string;
  a: ConflictSide;
  b: ConflictSide;
};

export type ConflictVerdict =
  | {
      confirmed: true;
      preferred: "a" | "b";
      basis: "tier" | "newer" | "first_listed";
      reason: string;
    }
  | {
      confirmed: false;
      dismissedBecause: "quote_not_found" | "same_source" | "same_statement";
    };

const TIER_RANK: Record<SourceTier, number> = {
  official: 0,
  third_party: 1,
  forum: 2,
};
const TIER_NAME: Record<SourceTier, string> = {
  official: "official",
  third_party: "third-party",
  forum: "forum",
};

function sameUrl(a: string, b: string): boolean {
  try {
    return normalizeUrl(a) === normalizeUrl(b);
  } catch {
    // Not a normalisable http(s) URL: fall back to comparing the text as written.
    return a === b;
  }
}

/**
 * The model can only propose a conflict. It stands only if both quotes are really on their pages,
 * the sources differ and the statements differ. Preference is rule-based: a more authoritative tier
 * wins, then the more recently updated page, then the first listed (the reason says so).
 */
export function resolveConflict(candidate: ConflictCandidate): ConflictVerdict {
  const { a, b } = candidate;
  if (!a.quoteMatched || !b.quoteMatched) {
    return { confirmed: false, dismissedBecause: "quote_not_found" };
  }
  if (sameUrl(a.draft.url, b.draft.url)) {
    return { confirmed: false, dismissedBecause: "same_source" };
  }
  if (normalizeText(a.draft.text) === normalizeText(b.draft.text)) {
    return { confirmed: false, dismissedBecause: "same_statement" };
  }

  if (TIER_RANK[a.tier] !== TIER_RANK[b.tier]) {
    const preferred = TIER_RANK[a.tier] < TIER_RANK[b.tier] ? "a" : "b";
    const winner = preferred === "a" ? a : b;
    const loser = preferred === "a" ? b : a;
    return {
      confirmed: true,
      preferred,
      basis: "tier",
      reason: `The ${TIER_NAME[winner.tier]} source is preferred over the ${TIER_NAME[loser.tier]} source.`,
    };
  }
  if (
    a.updatedAt &&
    b.updatedAt &&
    a.updatedAt.getTime() !== b.updatedAt.getTime()
  ) {
    return {
      confirmed: true,
      preferred: a.updatedAt > b.updatedAt ? "a" : "b",
      basis: "newer",
      reason: `Both sources are ${TIER_NAME[a.tier]}; the more recently updated source is preferred.`,
    };
  }
  return {
    confirmed: true,
    preferred: "a",
    basis: "first_listed",
    reason: `Both sources are ${TIER_NAME[a.tier]} and no update date is available, so the first listed source is shown first. The sources disagree.`,
  };
}
