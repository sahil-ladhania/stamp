/**
 * File: openai-retry.test.ts
 * Purpose: Tests the one retry on 429: when it happens, how long it waits, and that nothing else is retried.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { TimeoutError } from "../utils/with-timeout.js";
import { ModelCallError } from "./openai-client.js";
import {
  MAX_BACKOFF_MS,
  RATE_LIMIT_BACKOFF_MS,
  backoffMs,
  retryAfterMs,
  withRateLimitRetry,
} from "./openai-retry.js";

const limited = (headers?: unknown) =>
  new ModelCallError("gpt-4.1", 429, { cause: { headers } });
const noWait = () => Promise.resolve();

describe("withRateLimitRetry", () => {
  it("returns the result of a call that works, without waiting", async () => {
    const run = vi.fn().mockResolvedValue("ok");
    const wait = vi.fn(noWait);
    expect(await withRateLimitRetry(run, { wait })).toBe("ok");
    expect(run).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });

  it("retries once after a 429, waiting the backoff first, and returns the second result", async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(limited())
      .mockResolvedValue("ok");
    const wait = vi.fn(noWait);
    const onRetry = vi.fn();
    expect(
      await withRateLimitRetry(run, { wait, onRetry, random: () => 0.5 }),
    ).toBe("ok");
    expect(run).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledWith(RATE_LIMIT_BACKOFF_MS, undefined);
    expect(onRetry).toHaveBeenCalledWith({ delayMs: RATE_LIMIT_BACKOFF_MS });
  });

  it("throws the second 429: only one retry", async () => {
    const run = vi.fn().mockRejectedValue(limited());
    await expect(
      withRateLimitRetry(run, { wait: noWait }),
    ).rejects.toMatchObject({ status: 429 });
    expect(run).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["a 500", new ModelCallError("m", 500)],
    ["a 401", new ModelCallError("m", 401)],
    ["a network error with no status", new ModelCallError("m", undefined)],
    ["a timeout", new TimeoutError("OpenAI x", 1000)],
    ["a plain error", new Error("boom")],
  ])("does not retry %s", async (_name, err) => {
    const run = vi.fn().mockRejectedValue(err);
    await expect(withRateLimitRetry(run, { wait: noWait })).rejects.toBe(err);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("throws the 429 at once when there is no time to wait for the retry", async () => {
    const run = vi.fn().mockRejectedValue(limited());
    const wait = vi.fn(noWait);
    await expect(
      withRateLimitRetry(run, { wait, canWait: () => false }),
    ).rejects.toMatchObject({ status: 429 });
    expect(run).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });

  it("asks canWait about the delay it would use", async () => {
    const canWait = vi.fn(() => true);
    const run = vi
      .fn()
      .mockRejectedValueOnce(limited({ "retry-after": "3" }))
      .mockResolvedValue("ok");
    await withRateLimitRetry(run, { wait: noWait, canWait });
    expect(canWait).toHaveBeenCalledWith(3000);
  });

  it("stops without a second call when aborted during the wait", async () => {
    const controller = new AbortController();
    const reason = new Error("run cancelled");
    const run = vi.fn().mockRejectedValue(limited());
    const wait = vi.fn(async () => {
      controller.abort(reason);
    });
    await expect(
      withRateLimitRetry(run, { wait, signal: controller.signal }),
    ).rejects.toBe(reason);
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe("retryAfterMs and backoffMs", () => {
  it("reads retry-after-ms first, then retry-after in seconds, from a plain header object", () => {
    expect(
      retryAfterMs(limited({ "retry-after-ms": "1500", "retry-after": "9" })),
    ).toBe(1500);
    expect(retryAfterMs(limited({ "retry-after": "4" }))).toBe(4000);
  });

  it("reads the headers from a fetch Headers object", () => {
    expect(retryAfterMs(limited(new Headers({ "retry-after": "2" })))).toBe(
      2000,
    );
  });

  it.each([
    undefined,
    {},
    { "retry-after": "soon" },
    { "retry-after": "0" },
    "text",
  ])("has no hint from headers %j", (headers) => {
    expect(retryAfterMs(limited(headers))).toBeNull();
  });

  it("has no hint from an error with no cause", () => {
    expect(retryAfterMs(new ModelCallError("m", 429))).toBeNull();
    expect(retryAfterMs("nope")).toBeNull();
  });

  it("uses the default with jitter of plus or minus 25% when there is no hint", () => {
    expect(backoffMs(limited(), () => 0)).toBe(1500);
    expect(backoffMs(limited(), () => 0.5)).toBe(2000);
    expect(backoffMs(limited(), () => 1)).toBe(2500);
  });

  it("keeps a server hint between 0.5 s and 8 s", () => {
    expect(backoffMs(limited({ "retry-after": "120" }))).toBe(MAX_BACKOFF_MS);
    expect(backoffMs(limited({ "retry-after-ms": "10" }))).toBe(500);
  });
});
