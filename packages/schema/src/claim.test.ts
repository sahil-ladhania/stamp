/**
 * File: claim.test.ts
 * Purpose: Valid and invalid examples for Claim and Source schemas, including which claims may have no sources.
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

  it("rejects an unknown key", () => {
    const result = ClaimSchema.safeParse({ ...minimalClaim(), extra: true });
    expect(result.success).toBe(false);
  });
});

describe("ClaimSchema sources", () => {
  it("accepts an uncertain claim with no sources", () => {
    const unknown = minimalClaim({
      label: "uncertain",
      text: "Not found in the fetched sources.",
      sources: [],
    });
    expect(ClaimSchema.safeParse(unknown).success).toBe(true);
  });

  it("still accepts an uncertain claim with a source", () => {
    expect(
      ClaimSchema.safeParse(minimalClaim({ label: "uncertain" })).success,
    ).toBe(true);
  });

  it.each(["sourced", "tested"] as const)(
    "rejects a %s claim with no sources",
    (label) => {
      const result = ClaimSchema.safeParse(
        minimalClaim({ label, sources: [] }),
      );
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0]?.path).toEqual(["sources"]);
      expect(result.error.issues[0]?.message).toBe(
        "A sourced or tested claim needs at least one source",
      );
    },
  );

  it("still requires every source to have a real url and a quote", () => {
    const noQuote = minimalClaim({
      label: "uncertain",
      sources: [
        { url: "https://example.com/docs", quote: "", tier: "official" },
      ],
    });
    const badUrl = minimalClaim({
      label: "uncertain",
      sources: [{ url: "not a url", quote: "A quote", tier: "official" }],
    });
    expect(ClaimSchema.safeParse(noQuote).success).toBe(false);
    expect(ClaimSchema.safeParse(badUrl).success).toBe(false);
  });
});
