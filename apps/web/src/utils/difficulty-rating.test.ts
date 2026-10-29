/**
 * File: difficulty-rating.test.ts
 * Purpose: Tests when the web app shows a difficulty number and when it says "Not rated", and the words it uses for each.
 * Exports: (none)
 * Used by: vitest
 */
import type { Archetype, GuideSummary } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import {
  NOT_RATED,
  breakdownSentence,
  difficultyAriaLabel,
  isRated,
  whyLabel,
} from "./difficulty-rating";
import { sortByDifficulty } from "./sort-guides";

const KINDS: Archetype[] = [
  "instant",
  "hidden_limits",
  "review",
  "partner_gated",
  "enterprise",
];

describe("isRated", () => {
  it.each(KINDS)("is true for %s", (archetype) => {
    expect(isRated(archetype)).toBe(true);
  });

  it("is false only for unknown, the kind a guide gets when its review gate could not be verified", () => {
    expect(isRated("unknown")).toBe(false);
  });
});

describe("the words", () => {
  it('says "Not rated" plainly', () => {
    expect(NOT_RATED).toBe("Not rated");
  });

  it("reads a rated difficulty as a number out of 5, and an unrated one as not rated", () => {
    expect(difficultyAriaLabel(3, true)).toBe("Difficulty 3 of 5");
    expect(difficultyAriaLabel(2, false)).toBe("Difficulty not rated");
  });

  it("never puts the stored lower-bound number in the words for an unrated guide", () => {
    expect(difficultyAriaLabel(2, false)).not.toMatch(/\d/);
    expect(breakdownSentence(3, 2, false)).not.toMatch(/of 5/);
  });

  it("explains the points so far for an unrated guide, and the score for a rated one", () => {
    expect(breakdownSentence(5, 3, true)).toBe(
      "5 points, so the score is 3 of 5.",
    );
    expect(breakdownSentence(3, 2, false)).toBe(
      "3 points so far. The review gate is not verified, so Stamp does not rate this app.",
    );
  });

  it("labels the popover trigger for each case", () => {
    expect(whyLabel(true)).toBe("Why this score");
    expect(whyLabel(false)).toBe("Why not rated");
  });
});

describe("sorting guides that include an unrated one", () => {
  const guide = (
    slug: string,
    difficulty: number,
    archetype: Archetype,
  ): GuideSummary => ({
    slug,
    appName: slug,
    archetype,
    difficulty,
    mode: "live",
    asOf: "2026-10-29T00:00:00.000Z",
  });

  it("puts the unrated guide after the rated ones, in either direction", () => {
    const guides = [
      guide("b", 2, "unknown"),
      guide("a", 2, "review"),
      guide("c", 4, "review"),
    ];
    expect(sortByDifficulty(guides, "easiest").map((g) => g.slug)).toEqual([
      "a",
      "c",
      "b",
    ]);
    expect(sortByDifficulty(guides, "hardest").map((g) => g.slug)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
});
