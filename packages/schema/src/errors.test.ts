/**
 * File: errors.test.ts
 * Purpose: Valid and invalid examples for ApiErrorBodySchema.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { ApiErrorBodySchema } from "./errors.js";

describe("ApiErrorBodySchema", () => {
  it("accepts a standard error body", () => {
    expect(
      ApiErrorBodySchema.safeParse({
        error: { code: "NOT_FOUND", message: "We could not find that resource." },
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown error code", () => {
    expect(
      ApiErrorBodySchema.safeParse({
        error: { code: "UNKNOWN", message: "nope" },
      }).success,
    ).toBe(false);
  });
});
