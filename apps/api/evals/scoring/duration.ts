/**
 * File: duration.ts
 * Purpose: Tells whether a milestone effort or wait text is a duration, an honest unknown, or prose.
 * Exports: durationShape, DurationShape
 * Used by: evals/scoring/score-app.ts
 */
import { UNKNOWN_TEXT } from "../../src/agent/guide/unknown-claim.js";

export type DurationShape = "duration" | "unknown" | "prose";

const NUMBER = String.raw`\d+(?:\.\d+)?`;
const UNIT = String.raw`(?:minutes?|mins?|hours?|hrs?|(?:business |working |calendar )?days?|weeks?|months?)`;
const QUALIFIER = String.raw`(?:(?:about|around|roughly|approximately|up to|at least|under|less than|over|more than)\s+)?`;
// The whole text must be the duration: a sentence that contains one is prose.
const DURATION = new RegExp(
  `^${QUALIFIER}${NUMBER}(?:\\s*(?:to|-|–|—)\\s*${NUMBER})?\\s*${UNIT}\\.?$`,
  "i",
);
const PLAIN_ANSWER =
  /^(no wait|none|instant(?:ly)?|immediate(?:ly)?|same day)\.?$/i;
const UNKNOWN_TEXTS = new Set(Object.values(UNKNOWN_TEXT));

/** "3 to 7 days" is a duration; the agent's own unknown texts are unknown; anything else is prose. */
export function durationShape(text: string): DurationShape {
  const trimmed = text.trim();
  if (UNKNOWN_TEXTS.has(trimmed)) return "unknown";
  return DURATION.test(trimmed) || PLAIN_ANSWER.test(trimmed)
    ? "duration"
    : "prose";
}
