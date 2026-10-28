/**
 * File: unknown-claim.test.ts
 * Purpose: Tests the unknown claim: Uncertain, no sources, valid for the schema, and the reason chosen for each section state.
 * Exports: (none)
 * Used by: vitest
 */
import { ClaimSchema } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import { UNKNOWN_TEXT, makeUnknownClaim, unknownWhy } from "./unknown-claim.js";

describe("makeUnknownClaim", () => {
  it("is Uncertain with no sources, and valid for the schema", () => {
    const unknown = makeUnknownClaim("verdict.summary", "not_found");
    expect(unknown).toEqual({
      id: "verdict.summary",
      text: "Not found in the fetched sources.",
      label: "uncertain",
      sources: [],
    });
    expect(ClaimSchema.safeParse(unknown).success).toBe(true);
  });

  it("says what is unknown in plain words for each reason, with no guess", () => {
    expect(UNKNOWN_TEXT).toEqual({
      not_found: "Not found in the fetched sources.",
      time_budget: "Not researched before the time budget ran out.",
      unreadable: "Could not be read reliably from the fetched sources.",
    });
  });
});

describe("unknownWhy", () => {
  it("is time_budget for a section that never ran", () => {
    expect(unknownWhy(undefined)).toBe("time_budget");
  });

  it("is time_budget for a section that ran out of time, and unreadable for any other failure", () => {
    expect(unknownWhy({ status: "failed", reason: "time_budget" })).toBe(
      "time_budget",
    );
    expect(unknownWhy({ status: "failed", reason: "schema_failed" })).toBe(
      "unreadable",
    );
    expect(unknownWhy({ status: "failed", reason: "model_error" })).toBe(
      "unreadable",
    );
  });

  it("is not_found for an unknown section and for a gap in a drafted one", () => {
    expect(unknownWhy({ status: "unknown" })).toBe("not_found");
    expect(unknownWhy({ status: "drafted" })).toBe("not_found");
  });
});
