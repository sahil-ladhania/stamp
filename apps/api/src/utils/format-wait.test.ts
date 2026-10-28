/**
 * File: format-wait.test.ts
 * Purpose: Tests the wait phrase used in rate-limit messages.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { formatWait } from "./format-wait.js";

describe("formatWait", () => {
  it("says a minute for a short wait", () => {
    expect(formatWait(1)).toBe("a minute");
    expect(formatWait(60)).toBe("a minute");
  });

  it("rounds longer waits up to whole minutes", () => {
    expect(formatWait(61)).toBe("2 minutes");
    expect(formatWait(300)).toBe("5 minutes");
  });
});
