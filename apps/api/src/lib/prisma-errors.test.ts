/**
 * File: prisma-errors.test.ts
 * Purpose: Tests detection of Prisma unique-constraint errors.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { Prisma } from "../../generated/prisma/client.js";
import { isUniqueViolation } from "./prisma-errors.js";

function knownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("failed", {
    code,
    clientVersion: "test",
  });
}

describe("isUniqueViolation", () => {
  it("is true for a P2002 error", () => {
    expect(isUniqueViolation(knownError("P2002"))).toBe(true);
  });

  it("is false for other Prisma error codes", () => {
    expect(isUniqueViolation(knownError("P2025"))).toBe(false);
  });

  it("is false for plain errors and non-errors", () => {
    expect(isUniqueViolation(new Error("Unique constraint"))).toBe(false);
    expect(isUniqueViolation("P2002")).toBe(false);
  });
});
