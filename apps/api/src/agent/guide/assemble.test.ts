/**
 * File: assemble.test.ts
 * Purpose: Tests that the guide is built from verified claims and passes the schema: the score, the claims, partial coverage and conflicts.
 * Exports: (none)
 * Used by: vitest
 */
import { GuideSchema, type Claim } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import { build } from "../../test-support/assemble-helpers.js";
import { OAUTH_URL, QUOTES } from "../../test-support/extract-fixtures.js";

describe("assembleGuide", () => {
  it("builds a guide from full drafts that passes the schema", () => {
    const guide = build();
    expect(GuideSchema.safeParse(guide).success).toBe(true);
    expect(guide).toMatchObject({
      slug: "acme",
      mode: "live",
      coverage: "full",
      schemaVersion: 1,
      asOf: "2026-03-05T10:00:00.000Z",
    });
  });

  it("takes the difficulty score and the archetype from the score stage", () => {
    const guide = build({ archetype: "review" });
    expect(guide.archetype).toBe("review");
    expect(guide.difficulty).toBe(guide.difficultyBreakdown.score);
  });

  it("uses the verified claim for each slot, with its source", () => {
    const guide = build();
    expect(guide.steps[0]).toMatchObject({
      id: "steps.0",
      title: "Create the app",
    });
    expect(guide.steps[0]?.detail).toMatchObject({
      id: "steps.0.detail",
      label: "sourced",
    });
    expect(guide.steps[0]?.detail.sources[0]?.quote).toBe(QUOTES.secret);
  });

  it("marks the guide partial when the run was", () => {
    expect(build({ partial: true }).coverage).toBe("partial");
  });

  it("carries the confirmed conflicts through", () => {
    const conflict = {
      id: "conflicts.0",
      topic: "t",
      sourceA: {
        url: OAUTH_URL,
        quote: "q q q q q q",
        tier: "official" as const,
      },
      sourceB: {
        url: OAUTH_URL,
        quote: "r r r r r r",
        tier: "third_party" as const,
      },
      preferredUrl: OAUTH_URL,
      reason: build().limits[0] as Claim,
    };
    expect(build({ conflicts: [conflict] }).conflicts).toEqual([conflict]);
  });
});
