/**
 * File: enums.test.ts
 * Purpose: Tests the downgrade reasons a verified claim can carry, including the three added for the trust checks.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { DowngradeReasonSchema } from "./enums.js";

describe("DowngradeReasonSchema", () => {
  it.each([
    "quote_not_found",
    "sources_disagree",
    "stale_source",
    "schema_failed",
    "time_budget",
    "off_product",
    "not_supported",
    "third_party_only",
  ])("accepts %s", (reason) => {
    expect(DowngradeReasonSchema.safeParse(reason).success).toBe(true);
  });

  it("rejects a reason it does not know", () => {
    expect(DowngradeReasonSchema.safeParse("looks_wrong").success).toBe(false);
  });
});
