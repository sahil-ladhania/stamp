/**
 * File: normalize-text.ts
 * Purpose: Normalises text so a quote can be compared to page text exactly, ignoring only whitespace, case and unicode punctuation variants.
 * Exports: normalizeText
 * Used by: agent/evidence/quote-match.ts, agent/evidence/conflicts.ts
 */

const SINGLE_QUOTES = /[\u2018\u2019\u201A\u201B\u2032\u00B4]/g;
const DOUBLE_QUOTES = /[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g;
const DASHES = /[\u2010-\u2015\u2212]/g;
// Soft hyphen, zero-width space/joiners, word joiner and the byte-order mark.
const INVISIBLE = /[\u00AD\u200B-\u200D\u2060\uFEFF]/g;
const WHITESPACE = /\s+/g;

/**
 * Lowercases, folds unicode quotes and dashes to ASCII, drops invisible characters
 * and collapses every whitespace run to one space. Never fuzzy: no words are dropped,
 * reordered or stemmed. Apply it to both sides of a comparison; it is idempotent.
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, "-")
    .toLowerCase()
    .replace(WHITESPACE, " ")
    .trim();
}
