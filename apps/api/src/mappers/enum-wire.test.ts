/**
 * File: enum-wire.test.ts
 * Purpose: Round-trip checks for Prisma ↔ wire enum mappers.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  toPrismaArchetype,
  toPrismaGuideMode,
  toPrismaRunStatus,
  toPrismaSourceTier,
  toWireArchetype,
  toWireGuideMode,
  toWireRunStatus,
  toWireSourceTier,
} from "./enum-wire.js";

describe("enum-wire", () => {
  it("maps guide mode both ways", () => {
    expect(toWireGuideMode("LIBRARY")).toBe("library");
    expect(toPrismaGuideMode("live")).toBe("LIVE");
  });

  it("maps archetype hidden_limits", () => {
    expect(toWireArchetype("HIDDEN_LIMITS")).toBe("hidden_limits");
    expect(toPrismaArchetype("partner_gated")).toBe("PARTNER_GATED");
  });

  it("maps run status", () => {
    expect(toWireRunStatus("PARTIAL")).toBe("partial");
    expect(toPrismaRunStatus("failed")).toBe("FAILED");
  });

  it("maps source tier", () => {
    expect(toWireSourceTier("THIRD_PARTY")).toBe("third_party");
    expect(toPrismaSourceTier("forum")).toBe("FORUM");
  });
});
