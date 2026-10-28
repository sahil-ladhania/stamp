/**
 * File: claim.test.ts
 * Purpose: Valid and invalid examples for Claim and Source schemas.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { ClaimSchema } from "./claim.js";
import { minimalClaim } from "./test-fixtures.js";

describe("ClaimSchema", () => {
  it("accepts a valid claim", () => {
    expect(ClaimSchema.safeParse(minimalClaim()).success).toBe(true);
  });

  it("rejects a claim with a label field on draft-shaped payload missing id", () => {
    const result = ClaimSchema.safeParse({
      text: "Only text",
      label: "sourced",
      sources: [],
    });
    expect(result.success).toBe(false);
  });
});
