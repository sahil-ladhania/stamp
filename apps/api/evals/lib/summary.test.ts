/**
 * File: summary.test.ts
 * Purpose: Tests the roll-up of per-app scores into the success-metric numbers: counts, p95 time, means and the set targets.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { scoreApp } from "../scoring/score-app.js";
import { failedCapture, goodCapture } from "./fixtures/run-capture.js";
import { brokenCapture } from "./fixtures/broken-capture.js";
import { loadGolden } from "./golden.js";
import { percentile, summarize, targetFor } from "./summary.js";

const gmail = (await loadGolden()).find((g) => g.slug === "gmail")!;
const good = scoreApp(goodCapture(), gmail, 0.2);
const broken = scoreApp(brokenCapture(), gmail, 0.1);
const failed = scoreApp(failedCapture(), gmail, 0.05);

describe("percentile", () => {
  it("uses the nearest rank", () => {
    expect(percentile([10, 20, 30, 40, 50, 60], 95)).toBe(60);
    expect(percentile([10, 20, 30, 40, 50, 60], 50)).toBe(30);
  });

  it("returns null for no values", () => {
    expect(percentile([], 95)).toBeNull();
  });
});

describe("summarize", () => {
  const summary = summarize([good, broken, failed]);

  it("counts apps and the runs that ended in time", () => {
    expect(summary.apps).toBe(3);
    expect(summary.failed).toBe(1);
    expect(summary.endedInTime).toBe(2);
  });

  it("adds up wrong-product sources, fake scopes and contradictions", () => {
    expect(summary.wrongProductSources).toBe(1);
    expect(summary.fakeScopes).toBe(1);
    expect(summary.contradictions).toBe(3);
  });

  it("counts gate and wait matches and apps with at least two real scopes", () => {
    expect(summary.gateMatches).toBe(1);
    expect(summary.waitMatches).toBe(2);
    expect(summary.appsWithTwoRealScopes).toBe(1);
  });

  it("counts milestone fields that are a duration or unknown", () => {
    // good: 4 of 4, broken: 2 of 4, failed: 0 of 0
    expect(summary.milestoneOk).toBe(6);
    expect(summary.milestoneTotal).toBe(8);
  });

  it("counts top blocker outcomes", () => {
    expect(summary.topBlocker).toEqual({
      pass: 1,
      fail: 1,
      manual: 0,
      none: 1,
    });
  });

  it("reports p95 time, mean uncertain share and totals", () => {
    expect(summary.p95Seconds).toBe(61);
    expect(summary.totalCredits).toBe(26);
    expect(summary.totalCostUsd).toBeCloseTo(0.35, 6);
    expect(summary.meanCostUsd).toBeCloseTo(0.35 / 3, 6);
    expect(summary.meanUncertainShare).toBeGreaterThan(0);
  });

  it("leaves cost null when any run has an unknown cost", () => {
    const unknownCost = summarize([good, { ...broken, costUsd: null }]);
    expect(unknownCost.totalCostUsd).toBeNull();
    expect(unknownCost.meanCostUsd).toBeNull();
  });
});

describe("targetFor", () => {
  it("gives the contract targets for the tuning and holdout sets", () => {
    expect(targetFor("tuning", 6)).toEqual({
      gate: 5,
      scopeApps: 5,
      topBlocker: 5,
    });
    expect(targetFor("holdout", 4)).toEqual({
      gate: 3,
      scopeApps: null,
      topBlocker: null,
    });
  });

  it("gives no target for a single app or a partial set", () => {
    expect(targetFor("tuning", 1)).toBeNull();
  });
});

describe("summarize retrieval and claim quality", () => {
  const summary = summarize([good, broken, failed]);

  it("adds up the Sourced claims and those on good pages, and gives their share", () => {
    expect(summary.sourcedClaims).toBe(
      good.claimQuality.sourced + broken.claimQuality.sourced,
    );
    expect(summary.goodClaims).toBe(
      good.claimQuality.good + broken.claimQuality.good,
    );
    expect(summary.goodShare).toBeCloseTo(
      summary.goodClaims / summary.sourcedClaims,
      9,
    );
  });

  it("has a share of zero when nothing is Sourced", () => {
    expect(summarize([failed]).goodShare).toBe(0);
  });

  it("adds up the golden pages found and read", () => {
    expect(summary.goldenTotal).toBe(18);
    expect(summary.goldenInResults).toBe(
      good.goldenPages.inResults + broken.goldenPages.inResults,
    );
    expect(summary.goldenFetched).toBe(
      good.goldenPages.fetched + broken.goldenPages.fetched,
    );
  });
});
