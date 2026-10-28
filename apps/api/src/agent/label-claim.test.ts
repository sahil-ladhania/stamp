/**
 * File: label-claim.test.ts
 * Purpose: Tests draft-to-claim assembly with caller-supplied label and tier.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { toLabelledClaim } from "./label-claim.js";

describe("toLabelledClaim", () => {
  it("builds a claim with sources", () => {
    const claim = toLabelledClaim(
      {
        text: "Fact",
        quote: "Fact",
        url: "https://example.com/docs",
      },
      "sourced",
      "steps.0",
      "official",
    );
    expect(claim.label).toBe("sourced");
    expect(claim.sources[0]?.tier).toBe("official");
    expect(claim.sources[0]).not.toHaveProperty("retrievedAt");
  });

  it("records when the page was fetched", () => {
    const claim = toLabelledClaim(
      { text: "Fact", quote: "Fact", url: "https://example.com/docs" },
      "sourced",
      "steps.0",
      "official",
      "2026-03-05T10:00:00.000Z",
    );
    expect(claim.sources[0]?.retrievedAt).toBe("2026-03-05T10:00:00.000Z");
  });
});
