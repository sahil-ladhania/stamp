/**
 * File: with-timeout.test.ts
 * Purpose: Tests the timeout wrapper with fake timers.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimeoutError, withTimeout } from "./with-timeout.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("withTimeout", () => {
  it("resolves with the value when the work finishes in time", async () => {
    await expect(
      withTimeout(Promise.resolve("ok"), 1000, "work"),
    ).resolves.toBe("ok");
  });

  it("rejects with TimeoutError when the work is too slow", async () => {
    vi.useFakeTimers();
    const slow = new Promise<string>(() => {});
    const result = withTimeout(slow, 1000, "search");
    const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("passes through the work's own rejection", async () => {
    await expect(
      withTimeout(Promise.reject(new Error("boom")), 1000, "work"),
    ).rejects.toThrow("boom");
  });

  it("clears its timer once the work settles", async () => {
    vi.useFakeTimers();
    await withTimeout(Promise.resolve(1), 1000, "work");
    expect(vi.getTimerCount()).toBe(0);
  });
});
