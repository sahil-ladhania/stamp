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

  it("rejects with the signal's reason when the signal aborts first", async () => {
    const controller = new AbortController();
    const result = withTimeout(
      new Promise<string>(() => {}),
      60_000,
      "tavily",
      controller.signal,
    );
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
  });

  it("passes a custom abort reason through", async () => {
    const controller = new AbortController();
    const reason = new Error("run budget exhausted");
    const result = withTimeout(
      new Promise<string>(() => {}),
      60_000,
      "tavily",
      controller.signal,
    );
    controller.abort(reason);
    await expect(result).rejects.toBe(reason);
  });

  it("rejects at once for a signal that is already aborted, without leaving an unhandled rejection", async () => {
    const controller = new AbortController();
    controller.abort();
    const late = Promise.reject(new Error("late failure"));
    await expect(
      withTimeout(late, 1000, "work", controller.signal),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("removes its abort listener and timer once the work settles", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const removed = vi.spyOn(controller.signal, "removeEventListener");
    await withTimeout(Promise.resolve(1), 1000, "work", controller.signal);
    expect(removed).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("still times out when a signal is given but never aborts", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const result = withTimeout(
      new Promise<string>(() => {}),
      500,
      "search",
      controller.signal,
    );
    const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });
});
