/**
 * File: start-of-utc-day.test.ts
 * Purpose: Tests the UTC day boundary used by the daily run cap.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { startOfUtcDay } from "./start-of-utc-day.js";

describe("startOfUtcDay", () => {
  it("drops the time of day", () => {
    expect(
      startOfUtcDay(new Date("2026-03-05T17:45:10.500Z")).toISOString(),
    ).toBe("2026-03-05T00:00:00.000Z");
  });

  it("keeps the UTC day at the last millisecond", () => {
    expect(
      startOfUtcDay(new Date("2026-03-05T23:59:59.999Z")).toISOString(),
    ).toBe("2026-03-05T00:00:00.000Z");
  });

  it("does not change midnight itself", () => {
    expect(
      startOfUtcDay(new Date("2026-03-05T00:00:00.000Z")).toISOString(),
    ).toBe("2026-03-05T00:00:00.000Z");
  });
});
