/**
 * File: draft-claim.test.ts
 * Purpose: Ensures draft claims reject label fields from the model.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { DraftClaimSchema } from "./draft-claim.js";

describe("DraftClaimSchema", () => {
  it("accepts text quote and url", () => {
    expect(
      DraftClaimSchema.safeParse({
        text: "Fact",
        quote: "Fact",
        url: "https://example.com/docs",
      }).success,
    ).toBe(true);
  });

  it("rejects a label field", () => {
    expect(
      DraftClaimSchema.safeParse({
        text: "Fact",
        quote: "Fact",
        url: "https://example.com/docs",
        label: "sourced",
      }).success,
    ).toBe(false);
  });
});
