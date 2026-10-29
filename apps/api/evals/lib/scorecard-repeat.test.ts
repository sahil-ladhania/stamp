/**
 * File: scorecard-repeat.test.ts
 * Purpose: Tests the scorecard over several repetitions: mean and range per metric, the verdicts per repetition, and the stability line.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { scoreApp } from "../scoring/score-app.js";
import { brokenCapture } from "./fixtures/broken-capture.js";
import { goodCapture } from "./fixtures/run-capture.js";
import { loadGolden } from "./golden.js";
import { renderRepeatScorecard } from "./scorecard-repeat.js";

const gmail = (await loadGolden()).find((g) => g.slug === "gmail")!;
const good = scoreApp(goodCapture(), gmail, 0.2);
const broken = scoreApp(brokenCapture(), gmail, 0.1);
const meta = {
  label: "tuning",
  generatedAt: "2026-10-29T10:00:00.000Z",
  runDir: "evals/runs/x",
};
const card = renderRepeatScorecard([[good], [broken], [good]], meta);

describe("renderRepeatScorecard", () => {
  it("names the set and the number of repetitions", () => {
    expect(card.split("\n")[0]).toBe("# Scorecard: tuning, 3 repetitions");
  });

  it("explains how to read a cell", () => {
    expect(card).toContain("mean over the repetitions");
    expect(card).toContain("lowest to highest");
  });

  it("lists every success metric with its target and a mean with a range", () => {
    expect(card).toContain("| Metric | Target | Mean (lowest to highest) |");
    expect(card).toContain("| Wrong-product sources | 0 | 0.3 (0 to 1) |");
    expect(card).toContain("Sourced claims on good pages");
  });

  it("shows each repetition's verdict for each app and marks the ones that varied", () => {
    expect(card).toContain("| gmail | match, wrong, match (varies) |");
  });

  it("says how many verdicts differed between repetitions", () => {
    expect(card).toMatch(/\d+ of 4 verdicts differed between repetitions/);
  });

  it("points to the scorecard of each repetition", () => {
    expect(card).toContain("rep-1/scorecard.md");
    expect(card).toContain("rep-3/scorecard.md");
  });
});
