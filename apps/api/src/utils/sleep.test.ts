/**
 * File: sleep.test.ts
 * Purpose: Tests the abortable sleep.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { sleep } from "./sleep.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("sleep", () => {
  it("resolves after the delay", async () => {
    vi.useFakeTimers();
    let done = false;
    const pending = sleep(1000).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(done).toBe(true);
  });

  it("resolves early when the signal aborts", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const pending = sleep(60_000, controller.signal);
    controller.abort();
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("resolves at once for an already aborted signal", async () => {
    const controller = new AbortController();
    controller.abort();
    await sleep(60_000, controller.signal);
  });
});
