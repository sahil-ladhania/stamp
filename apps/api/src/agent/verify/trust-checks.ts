/**
 * File: trust-checks.ts
 * Purpose: Deterministic checks on a claim whose quote matched its page: the page is legacy, scope names come only from a third party, or the claim names numbers or scopes the quote does not contain.
 * Exports: trustCheck, TrustInput
 * Used by: agent/verify/verify-claims.ts
 */
import type { DowngradeReason, SourceTier } from "@stamp/schema";
import { normalizeText } from "../../utils/normalize-text.js";

export type TrustInput = {
  id: string;
  claimText: string;
  quote: string;
  url: string;
  /** The page's title from the search result; absent when the page was not found by a search. */
  title: string | undefined;
  tier: SourceTier;
};

const LEGACY = /\b(?:legacy|deprecated|archived|sunset|retired)\b/i;
const LEGACY_PATH = /\/(?:legacy|deprecated|archive|archived)(?:\/|$)/i;
/** Colon style (`chat:write`, `admin.apps:read`) and dotted style (`User.Read.All`) scope names. */
const SCOPE_NAMES =
  /\b[a-z][a-z0-9_-]*(?:\.[a-z0-9_-]+)*(?::[a-z0-9_.-]+)+\b|\b[A-Z][a-z]+(?:\.[A-Z][A-Za-z]+)+\b/g;
const FIGURES = /\d+(?:[.,]\d+)*/g;

const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
};

const isLegacy = (url: string, title: string | undefined): boolean =>
  LEGACY.test(title ?? "") || LEGACY_PATH.test(pathOf(url));

/** Numbers of two or more digits, with separators dropped, so "1,000" and "1000" compare equal. */
const figuresOf = (text: string): string[] =>
  (text.match(FIGURES) ?? [])
    .map((figure) => figure.replace(/[,]/g, ""))
    .filter((figure) => figure.replace(/\D/g, "").length >= 2);

/**
 * The reason a claim whose quote matched should not stay Sourced, or null. In order: a legacy page; scope
 * names that no official page gave; numbers or scope names in the claim that the quote does not contain.
 * Words and meaning are the model judge's job; these checks only catch what text comparison can.
 */
export function trustCheck(input: TrustInput): DowngradeReason | null {
  if (isLegacy(input.url, input.title)) {
    return "stale_source";
  }
  if (input.id.split(".")[0] === "scopes" && input.tier !== "official") {
    return "third_party_only";
  }
  const quote = normalizeText(input.quote).replace(/,/g, "");
  const missingFigure = figuresOf(input.claimText).some(
    (figure) => !quote.includes(figure),
  );
  const missingScope = (input.claimText.match(SCOPE_NAMES) ?? []).some(
    (name) => !quote.includes(normalizeText(name)),
  );
  return missingFigure || missingScope ? "not_supported" : null;
}
