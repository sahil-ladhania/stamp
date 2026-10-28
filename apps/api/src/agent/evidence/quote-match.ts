/**
 * File: quote-match.ts
 * Purpose: Checks that a quote appears word for word in a fetched page, after normalising both sides.
 * Exports: matchQuote, MIN_QUOTE_LENGTH, QuoteMatch
 * Used by: agent/evidence/labelling.ts, agent/nodes/verify.ts
 */
import { normalizeText } from "../../utils/normalize-text.js";

/** Shorter quotes ("the", "oauth") would match almost any page, so they are not evidence. */
export const MIN_QUOTE_LENGTH = 10;

export type QuoteMatch =
  | { matched: true }
  | {
      matched: false;
      reason: "empty_quote" | "quote_too_short" | "empty_page" | "not_found";
    };

const WORD_CHARACTER = /[\p{L}\p{N}]/u;

function isWordCharacter(character: string | undefined): boolean {
  return character !== undefined && WORD_CHARACTER.test(character);
}

/**
 * True when the normalised quote occurs in the normalised page and is not cut out of a longer word or
 * number ("25 installs" must not match "125 installs"). Exact, never fuzzy: no stemming, no reordering,
 * no ellipsis handling, so a quote with "..." only matches a page that contains the "...".
 */
export function matchQuote(quote: string, pageText: string): QuoteMatch {
  const needle = normalizeText(quote);
  if (needle === "") {
    return { matched: false, reason: "empty_quote" };
  }
  if (needle.length < MIN_QUOTE_LENGTH) {
    return { matched: false, reason: "quote_too_short" };
  }
  const haystack = normalizeText(pageText);
  if (haystack === "") {
    return { matched: false, reason: "empty_page" };
  }

  const first = needle[0];
  const last = needle[needle.length - 1];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) {
      return { matched: false, reason: "not_found" };
    }
    const startsCleanly =
      !isWordCharacter(first) || !isWordCharacter(haystack[at - 1]);
    const endsCleanly =
      !isWordCharacter(last) || !isWordCharacter(haystack[at + needle.length]);
    if (startsCleanly && endsCleanly) {
      return { matched: true };
    }
    from = at + 1;
  }
}
