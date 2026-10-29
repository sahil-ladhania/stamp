/**
 * File: build-guide.test.ts
 * Purpose: Tests building a checked guide from the final state: the success case and each reason it cannot.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { readyState } from "../../test-support/save-helpers.js";
import { buildGuide } from "./build-guide.js";

const AS_OF = new Date("2026-10-29T10:00:00.000Z");

describe("buildGuide", () => {
  it("builds a live guide stamped with the given time", () => {
    const built = buildGuide(readyState(), AS_OF);
    expect(built.ok).toBe(true);
    if (built.ok) {
      expect(built.guide).toMatchObject({
        slug: "acme",
        mode: "live",
        coverage: "full",
        asOf: AS_OF.toISOString(),
      });
    }
  });

  it("fails when the score is missing", () => {
    expect(buildGuide(readyState({ difficulty: null }), AS_OF)).toEqual({
      ok: false,
      reason: "missing app or score",
    });
  });

  it("fails when no claim is Sourced or Tested", () => {
    const allUncertain = readyState().claims.map((claim) => ({
      ...claim,
      label: "uncertain" as const,
    }));
    expect(buildGuide(readyState({ claims: allUncertain }), AS_OF)).toEqual({
      ok: false,
      reason: "no sourced claim",
    });
  });

  it("marks the guide partial when the state says so", () => {
    const built = buildGuide(readyState({ partial: true }), AS_OF);
    expect(built.ok && built.guide.coverage).toBe("partial");
  });
});
