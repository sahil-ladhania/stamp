/**
 * File: difficulty-bands.test.ts
 * Purpose: Tests every difficulty total (0 to 9), every score band (1 to 5) and the schema contract.
 * Exports: (none)
 * Used by: vitest
 */
import { DifficultyBreakdownSchema } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import {
  scoreDifficulty,
  type ApprovalWait,
  type ReviewGate,
} from "./difficulty.js";
import { days, facts } from "./fixtures/gate-facts.js";

describe("scoreDifficulty totals and bands", () => {
  const bandFor = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
  const gates: ReviewGate[] = [
    "unknown",
    "optional_listing",
    "required_to_scale",
    "security_assessment",
  ];
  const gatePoints = [0, 1, 2, 3];
  const waits: [ApprovalWait, number][] = [
    ["none", 0],
    [days(0, 0.5), 0],
    [days(1, 3), 1],
    [days(7, 14), 2],
    [days(30, 60), 3],
  ];

  it("matches an independent calculation for every combination of factors", () => {
    let checked = 0;
    for (const [g, gate] of gates.entries()) {
      for (const [wait, waitPoints] of waits) {
        for (const prerequisites of [0, 1, 2, 3]) {
          for (const hiddenLimits of [0, 1, 2]) {
            const expectedTotal =
              (gatePoints[g] ?? 0) +
              waitPoints +
              Math.min(prerequisites, 2) +
              (hiddenLimits > 0 ? 1 : 0);
            const result = scoreDifficulty(
              facts({
                reviewGate: gate,
                approvalWait: wait,
                prerequisites,
                hiddenLimits,
              }),
            );
            expect(result.total).toBe(expectedTotal);
            expect(result.score).toBe(bandFor[expectedTotal]);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBe(4 * 5 * 4 * 3);
  });

  it("reaches every total from 0 to 9 and every score from 1 to 5", () => {
    const totals = new Set<number>();
    const scores = new Set<number>();
    for (const gate of gates) {
      for (const [wait] of waits) {
        for (const prerequisites of [0, 1, 2]) {
          for (const hiddenLimits of [0, 1]) {
            const result = scoreDifficulty(
              facts({
                reviewGate: gate,
                approvalWait: wait,
                prerequisites,
                hiddenLimits,
              }),
            );
            totals.add(result.total);
            scores.add(result.score);
          }
        }
      }
    }
    expect([...totals].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect([...scores].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it.each([
    [0, 1],
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 3],
    [5, 3],
    [6, 4],
    [7, 4],
    [8, 5],
    [9, 5],
  ])("maps a total of %i to a score of %i", (total, score) => {
    const gate = Math.min(total, 3);
    const rest = total - gate;
    const waitPoints = Math.min(rest, 3);
    const afterWait = rest - waitPoints;
    const prerequisites = Math.min(afterWait, 2);
    const hiddenLimits = afterWait - prerequisites;
    const waitByPoints: ApprovalWait[] = [
      "none",
      days(1, 3),
      days(7, 14),
      days(30, 60),
    ];
    const result = scoreDifficulty(
      facts({
        reviewGate:
          (
            [
              "unknown",
              "optional_listing",
              "required_to_scale",
              "security_assessment",
            ] as const
          )[gate] ?? "unknown",
        approvalWait: waitByPoints[waitPoints] ?? "none",
        prerequisites,
        hiddenLimits,
      }),
    );
    expect(result.total).toBe(total);
    expect(result.score).toBe(score);
  });

  it("always produces a breakdown the shared schema accepts", () => {
    for (const gate of gates) {
      for (const [wait] of waits) {
        const result = scoreDifficulty(
          facts({
            reviewGate: gate,
            approvalWait: wait,
            prerequisites: 3,
            hiddenLimits: 3,
          }),
        );
        expect(DifficultyBreakdownSchema.safeParse(result).success).toBe(true);
      }
    }
  });

  it("scores a HubSpot-like app 4 of 5: listing required, unknown wait, one prerequisite, install cap", () => {
    const result = scoreDifficulty(
      facts({
        reviewGate: "required_to_scale",
        approvalWait: "unknown",
        prerequisites: 1,
        hiddenLimits: 1,
      }),
    );
    expect(result).toEqual({
      reviewGate: 2,
      approvalWait: 2,
      prerequisites: 1,
      hiddenLimits: 1,
      total: 6,
      score: 4,
    });
  });

  it("scores a GitHub-like app 1 of 5: no review, nothing else", () => {
    expect(
      scoreDifficulty(facts({ reviewGate: "none", approvalWait: "unknown" }))
        .score,
    ).toBe(1);
  });
});
