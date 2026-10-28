/**
 * File: difficulty.test.ts
 * Purpose: Tests the difficulty factors: gate points, wait boundaries, caps, the none-gate rule and invalid input.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  approvalWaitPoints,
  reviewGatePoints,
  scoreDifficulty,
} from "./difficulty.js";
import { days, facts } from "./fixtures/gate-facts.js";

describe("reviewGatePoints", () => {
  it.each([
    ["unknown", 0],
    ["none", 0],
    ["optional_listing", 1],
    ["required_to_scale", 2],
    ["security_assessment", 3],
    ["partner_vetting", 3],
  ] as const)("scores %s as %i", (gate, points) => {
    expect(reviewGatePoints(gate)).toBe(points);
  });
});

describe("approvalWaitPoints", () => {
  it("scores no approval step as 0 and an unknown wait as 2", () => {
    expect(approvalWaitPoints("none")).toBe(0);
    expect(approvalWaitPoints("unknown")).toBe(2);
  });

  it.each([
    [0, 0, 0],
    [0, 0.99, 0],
    [0, 1, 1],
    [1, 3, 1],
    [1, 7, 1],
    [1, 7.01, 2],
    [7, 14, 2],
    [7, 28, 2],
    [14, 28.01, 3],
    [29, 60, 3],
    [60, 60, 3],
  ])("scores a wait of %f to %f days as %i", (minDays, maxDays, points) => {
    expect(approvalWaitPoints(days(minDays, maxDays))).toBe(points);
  });

  it("scores by the upper end of the range", () => {
    expect(approvalWaitPoints(days(0, 40))).toBe(3);
  });

  it("throws for ranges that make no sense", () => {
    for (const bad of [
      days(-1, 3),
      days(5, 2),
      days(Number.NaN, 3),
      days(1, Number.POSITIVE_INFINITY),
    ]) {
      expect(() => approvalWaitPoints(bad)).toThrow(RangeError);
    }
  });
});

describe("scoreDifficulty factors", () => {
  it("caps prerequisites at 2 points", () => {
    expect(
      [0, 1, 2, 3, 10].map(
        (n) => scoreDifficulty(facts({ prerequisites: n })).prerequisites,
      ),
    ).toEqual([0, 1, 2, 2, 2]);
  });

  it("gives hidden limits 1 point for any number of limits", () => {
    expect(
      [0, 1, 5].map(
        (n) => scoreDifficulty(facts({ hiddenLimits: n })).hiddenLimits,
      ),
    ).toEqual([0, 1, 1]);
  });

  it("counts an unknown review gate as no gate but an unknown wait as 2", () => {
    const result = scoreDifficulty(
      facts({ reviewGate: "unknown", approvalWait: "unknown" }),
    );
    expect(result).toMatchObject({
      reviewGate: 0,
      approvalWait: 2,
      total: 2,
      score: 2,
    });
  });

  it("costs nothing for the wait when the review gate is verified as none", () => {
    for (const wait of ["unknown", "none", days(0, 60)] as const) {
      expect(
        scoreDifficulty(facts({ reviewGate: "none", approvalWait: wait }))
          .approvalWait,
      ).toBe(0);
    }
  });

  it("ignores the enterprise flag when scoring", () => {
    expect(scoreDifficulty(facts({ needsEnterprisePlan: true }))).toEqual(
      scoreDifficulty(facts({ needsEnterprisePlan: false })),
    );
  });

  it("throws for negative, fractional or non-numeric counts", () => {
    for (const bad of [-1, 1.5, Number.NaN]) {
      expect(() => scoreDifficulty(facts({ prerequisites: bad }))).toThrow(
        RangeError,
      );
      expect(() => scoreDifficulty(facts({ hiddenLimits: bad }))).toThrow(
        RangeError,
      );
    }
  });
});
