/**
 * File: guides.test.ts
 * Purpose: Valid and invalid examples for claim report API schemas.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  CreateClaimReportInputSchema,
  CreateClaimReportResultSchema,
} from "./guides.js";

describe("CreateClaimReportInputSchema", () => {
  it("accepts claimId and note", () => {
    expect(
      CreateClaimReportInputSchema.safeParse({
        claimId: "steps.5",
        note: "Callback path changed",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid claim id pattern", () => {
    expect(
      CreateClaimReportInputSchema.safeParse({ claimId: "Steps.5" }).success,
    ).toBe(false);
  });
});

describe("CreateClaimReportResultSchema", () => {
  it("accepts reportId", () => {
    expect(
      CreateClaimReportResultSchema.safeParse({ reportId: "rep_1" }).success,
    ).toBe(true);
  });

  it("rejects empty reportId", () => {
    expect(
      CreateClaimReportResultSchema.safeParse({ reportId: "" }).success,
    ).toBe(false);
  });
});
