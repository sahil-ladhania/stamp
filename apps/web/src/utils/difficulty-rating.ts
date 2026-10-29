/**
 * File: difficulty-rating.ts
 * Purpose: When a guide's difficulty is shown as a number and when it says "Not rated", and the words for each. A guide whose review gate could not be verified has the archetype unknown, and its stored score is only a lower bound.
 * Exports: NOT_RATED, isRated, difficultyAriaLabel, breakdownSentence, whyLabel
 * Used by: components/shared/DifficultyDots.tsx, components/verdict/StampMark.tsx, components/verdict/DifficultyRow.tsx, components/verdict/DifficultyPopover.tsx, guide cards and rows
 */
import type { Archetype } from "@stamp/schema";

export const NOT_RATED = "Not rated";

/** A number is shown only for a guide with a verified review gate; unknown means the gate could not be verified. */
export function isRated(archetype: Archetype): boolean {
  return archetype !== "unknown";
}

/** The text equivalent of the dots or the stamp. */
export function difficultyAriaLabel(score: number, hasRating: boolean): string {
  return hasRating ? `Difficulty ${score} of 5` : "Difficulty not rated";
}

/** The line under the difficulty factors. An unrated guide's points are a lower bound, so no score is claimed. */
export function breakdownSentence(
  total: number,
  score: number,
  hasRating: boolean,
): string {
  return hasRating
    ? `${total} points, so the score is ${score} of 5.`
    : `${total} points so far. The review gate is not verified, so Stamp does not rate this app.`;
}

export function whyLabel(hasRating: boolean): string {
  return hasRating ? "Why this score" : "Why not rated";
}
