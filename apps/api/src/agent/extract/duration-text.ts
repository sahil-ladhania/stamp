/**
 * File: duration-text.ts
 * Purpose: Reads a time out of a quote and writes it in one form ("3 to 7 business days"), so a milestone's text is a duration written by code, never prose from the model.
 * Exports: durationFromQuote
 * Used by: agent/extract/sanitize.ts
 */

const WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};
const NUMBER = String.raw`(?:\d+(?:\.\d+)?|${Object.keys(WORDS).join("|")})`;
const UNIT = String.raw`(?:minute|hour|day|week|month)s?`;
const KIND = String.raw`(?:(?:business|working|calendar)\s+)?`;
const RANGE = String.raw`(?:to|-|–|—|or|and)`;
const PATTERN = new RegExp(
  String.raw`(?<![\w.])(?:(between)\s+)?(${NUMBER})(?:\s*${RANGE}\s*(${NUMBER}))?\s*(${KIND})(${UNIT})(?![a-z])`,
  "i",
);
/** What comes just before the number, as the qualifier the guide shows. */
const QUALIFIERS: [RegExp, string][] = [
  [/(?:up to|within|no more than|at most|not more than)\s*$/i, "up to"],
  [/(?:at least|a minimum of|minimum of)\s*$/i, "at least"],
  [/(?:about|around|approximately|roughly|~)\s*$/i, "about"],
  [/(?:under|less than|fewer than)\s*$/i, "under"],
  [/(?:over|more than)\s*$/i, "over"],
];

const valueOf = (token: string): number =>
  WORDS[token.toLowerCase()] ?? Number(token);

/**
 * The first time the quote states, such as "5 to 7 business days", "up to 6 weeks" or "2 weeks" (number words
 * become digits), or null when it states none. A number that is part of a longer word, or is followed by
 * anything but a time unit ("100 requests", "5 per day"), is not a time.
 */
export function durationFromQuote(quote: string): string | null {
  const found = PATTERN.exec(quote);
  if (found === null) return null;
  const [, between, first, second, kind, unit] = found;
  if (first === undefined || unit === undefined) return null;
  const low = valueOf(first);
  const high = second === undefined ? null : valueOf(second);
  if (high !== null && high < low) return null;
  const before = quote.slice(0, found.index);
  const qualifier =
    high === null && between === undefined
      ? (QUALIFIERS.find(([pattern]) => pattern.test(before))?.[1] ?? "")
      : "";
  const last = high ?? low;
  const name = unit.toLowerCase().replace(/s$/, "") + (last === 1 ? "" : "s");
  const amount = high === null ? `${low}` : `${low} to ${high}`;
  const words = [qualifier, amount, `${(kind ?? "").trim()} ${name}`.trim()];
  return words.filter((part) => part !== "").join(" ");
}
