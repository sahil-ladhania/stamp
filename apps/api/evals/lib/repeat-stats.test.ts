/**
 * File: repeat-stats.test.ts
 * Purpose: Tests the statistics over repetitions: mean and range of each success metric, and the verdicts that differ between repetitions.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { scoreApp } from "../scoring/score-app.js";
import { brokenCapture } from "./fixtures/broken-capture.js";
import { goodCapture } from "./fixtures/run-capture.js";
import { loadGolden } from "./golden.js";
import { metricStats, stat, verdictFlips } from "./repeat-stats.js";

const gmail = (await loadGolden()).find((g) => g.slug === "gmail")!;
const good = scoreApp(goodCapture(), gmail, 0.2);
const broken = scoreApp(brokenCapture(), gmail, 0.1);
const statFor = (reps: (typeof good)[][], name: string) =>
  metricStats(reps).find((entry) => entry.metric.name === name)?.stat;

describe("stat", () => {
  it("gives the mean, lowest and highest of the values", () => {
    expect(stat([1, 2, 3])).toEqual({ mean: 2, min: 1, max: 3 });
  });

  it("gives one value as its own mean, lowest and highest", () => {
    expect(stat([5])).toEqual({ mean: 5, min: 5, max: 5 });
  });
});

describe("metricStats", () => {
  it("takes each metric's value from each repetition's own summary", () => {
    const reps = [[good], [broken], [good]];
    const wrong = statFor(reps, "Wrong-product sources");
    expect(wrong?.min).toBe(0);
    expect(wrong?.max).toBe(1);
    expect(wrong?.mean).toBeCloseTo(1 / 3, 9);
  });

  it("keeps the worst repetition visible for a target of zero", () => {
    expect(
      statFor([[good], [good], [broken]], "Wrong-product sources")?.max,
    ).toBe(1);
  });

  it("has no statistic for a metric that is unknown in any repetition", () => {
    const noCost = { ...broken, costUsd: null };
    expect(statFor([[good], [noCost]], "Cost per run")).toBeNull();
  });

  it("returns one entry for every metric", () => {
    expect(metricStats([[good]]).length).toBe(14);
  });
});

describe("verdictFlips", () => {
  it("lists the apps whose verdict differs between repetitions, with each repetition's value", () => {
    const { flips, cells } = verdictFlips([[good], [broken], [good]]);
    const gate = flips.find((flip) => flip.field === "review gate");
    expect(gate).toEqual({
      app: "gmail",
      field: "review gate",
      values: ["match", "wrong", "match"],
    });
    expect(cells).toBe(4);
  });

  it("finds no flips when every repetition agrees", () => {
    expect(verdictFlips([[good], [good]]).flips).toEqual([]);
  });

  it("writes missing for an app that a repetition did not run", () => {
    const { flips } = verdictFlips([[good], []]);
    expect(flips.length).toBeGreaterThan(0);
    expect(flips[0]?.values).toContain("missing");
  });
});
