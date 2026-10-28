/**
 * File: budget-limits.test.ts
 * Purpose: Tests the page allowance, the single retry gate and the schema-repair limit.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  FIRST_PASS_PAGE_CAP,
  RETRY_MIN_REMAINING_MS,
  canRepairSchema,
  canRetry,
  pageAllowance,
  startBudget,
} from "./budget.js";

const T0 = 1_000_000;
const clock = startBudget(T0);
const at = (secondsIn: number): number => T0 + secondsIn * 1000;

describe("pageAllowance", () => {
  it("allows 4 pages on the first pass and leaves 2 for the retry", () => {
    expect(FIRST_PASS_PAGE_CAP).toBe(4);
    expect(pageAllowance(0, false)).toBe(4);
    expect(pageAllowance(0, true)).toBe(6);
  });

  it("gives the retry whatever the first pass left", () => {
    expect(pageAllowance(4, true)).toBe(2);
    expect(pageAllowance(3, true)).toBe(3);
  });

  it("counts pages already fetched against the total of 6", () => {
    expect(pageAllowance(2, false)).toBe(4);
    expect(pageAllowance(5, false)).toBe(1);
    expect(pageAllowance(6, false)).toBe(0);
    expect(pageAllowance(9, true)).toBe(0);
  });
});

describe("canRetry", () => {
  it("allows one retry while at least 40 s remain", () => {
    expect(RETRY_MIN_REMAINING_MS).toBe(40_000);
    expect(canRetry(clock, at(60), 0)).toBe(true);
    expect(canRetry(clock, at(80), 0)).toBe(true);
  });

  it("refuses a retry with less than 40 s left", () => {
    expect(canRetry(clock, at(80.001), 0)).toBe(false);
    expect(canRetry(clock, at(110), 0)).toBe(false);
  });

  it("refuses a second retry whatever the time", () => {
    expect(canRetry(clock, at(0), 1)).toBe(false);
    expect(canRetry(clock, at(0), 2)).toBe(false);
  });
});

describe("canRepairSchema", () => {
  it("allows one repair per section", () => {
    expect(canRepairSchema(0)).toBe(true);
    expect(canRepairSchema(1)).toBe(false);
    expect(canRepairSchema(2)).toBe(false);
  });
});
