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
  });
});
