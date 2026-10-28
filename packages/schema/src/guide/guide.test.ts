/**
 * File: guide.test.ts
 * Purpose: Valid and invalid examples for Guide and GuideSummary schemas.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { GuideSchema, GuideSummarySchema } from "./guide.js";
import { minimalClaim, minimalGuide } from "../test-fixtures.js";

describe("GuideSummarySchema", () => {
  it("accepts a valid library list item", () => {
    const result = GuideSummarySchema.safeParse({
      slug: "hubspot",
      appName: "HubSpot",
      archetype: "hidden_limits",
      difficulty: 4,
      mode: "library",
      asOf: "2026-01-15T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown keys", () => {
    const result = GuideSummarySchema.safeParse({
      slug: "hubspot",
      appName: "HubSpot",
      archetype: "hidden_limits",
      difficulty: 4,
      mode: "library",
      asOf: "2026-01-15",
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("GuideSchema", () => {
  it("accepts a minimal valid guide", () => {
    const result = GuideSchema.safeParse(minimalGuide());
    expect(result.success).toBe(true);
  });

  it("accepts a guide whose unknown claims are uncertain with no sources", () => {
    const unknown = (id: string) =>
      minimalClaim({
        id,
        label: "uncertain",
        text: "Not found in the fetched sources.",
        sources: [],
      });
    const guide = minimalGuide({
      coverage: "partial",
      verdict: {
        summary: unknown("verdict.summary"),
        nextStepId: null,
        topBlockerId: null,
      },
      milestones: {
        firstTest: {
          effort: unknown("milestones.firstTest.effort"),
          wait: unknown("milestones.firstTest.wait"),
        },
        production: {
          effort: unknown("milestones.production.effort"),
          wait: unknown("milestones.production.wait"),
        },
      },
    });
    expect(GuideSchema.safeParse(guide).success).toBe(true);
  });

  it("rejects a guide with a sourced claim that has no sources, naming where", () => {
    const guide = minimalGuide({
      verdict: {
        summary: minimalClaim({
          id: "verdict.summary",
          label: "sourced",
          sources: [],
        }),
        nextStepId: "steps.0",
        topBlockerId: "blockers.0",
      },
    });
    const result = GuideSchema.safeParse(guide);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
      "verdict.summary.sources",
    );
  });

  it("rejects a guide with mismatched difficulty score", () => {
    const bad = minimalGuide({
      difficultyBreakdown: {
        reviewGate: 2,
        approvalWait: 1,
        prerequisites: 1,
        hiddenLimits: 1,
        total: 5,
        score: 5,
      },
    });
    const result = GuideSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});
