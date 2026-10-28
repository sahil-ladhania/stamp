/**
 * File: openai-retry.ts
 * Purpose: Retries a model call once, after a backoff, when OpenAI answers 429 (rate limited); every other outcome passes through.
 * Exports: withRateLimitRetry, backoffMs, retryAfterMs, RATE_LIMIT_BACKOFF_MS, MAX_BACKOFF_MS, RetryOptions
 * Used by: agent/extract/run-section.ts
 */
import { sleep } from "../utils/sleep.js";
import { ModelCallError } from "./openai-client.js";

/** Wait before the retry when the server gives no hint; jittered by plus or minus 25%. */
export const RATE_LIMIT_BACKOFF_MS = 2_000;
/** Never wait longer than this, whatever Retry-After says: the run has a 120 s budget. */
export const MAX_BACKOFF_MS = 8_000;
const MIN_BACKOFF_MS = 500;

export type RetryOptions = {
  signal?: AbortSignal;
  /** Return false when waiting that long leaves no time for a retry: the 429 is then thrown at once. */
  canWait?: (delayMs: number) => boolean;
  onRetry?: (info: { delayMs: number }) => void;
  /** Jitter source in [0, 1); tests pass a fixed one. */
  random?: () => number;
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

function headerValue(headers: unknown, name: string): string | null {
  if (typeof headers !== "object" || headers === null) {
    return null;
  }
  const get = Reflect.get(headers, "get");
  if (typeof get === "function") {
    const value: unknown = get.call(headers, name);
    return typeof value === "string" ? value : null;
  }
  const value: unknown = Reflect.get(headers, name);
  return typeof value === "string" ? value : null;
}

/** The server's wait hint in milliseconds from `retry-after-ms` or `retry-after` (seconds), if usable. */
export function retryAfterMs(error: unknown): number | null {
  const cause: unknown = error instanceof Error ? error.cause : undefined;
  const headers: unknown =
    typeof cause === "object" && cause !== null
      ? Reflect.get(cause, "headers")
      : undefined;
  const millis = Number(headerValue(headers, "retry-after-ms"));
  if (Number.isFinite(millis) && millis > 0) {
    return millis;
  }
  const seconds = Number(headerValue(headers, "retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
}

/** The server's hint if it gave one, else the default with jitter; always between 0.5 s and 8 s. */
export function backoffMs(
  error: unknown,
  random: () => number = Math.random,
): number {
  const hint = retryAfterMs(error);
  const delay = hint ?? RATE_LIMIT_BACKOFF_MS * (0.75 + 0.5 * random());
  return Math.min(MAX_BACKOFF_MS, Math.max(MIN_BACKOFF_MS, delay));
}

/**
 * Runs the call; on a 429 waits and runs it once more. A second 429, any other error and an abort are thrown
 * as they are. The OpenAI client also retries once inside a single call; this layer is the explicit,
 * logged one, and it is the only one that waits for a server hint.
 */
export async function withRateLimitRetry<T>(
  run: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (!(err instanceof ModelCallError) || err.status !== 429) {
      throw err;
    }
    const delayMs = backoffMs(err, options.random);
    if (options.canWait && !options.canWait(delayMs)) {
      throw err;
    }
    options.onRetry?.({ delayMs });
    await (options.wait ?? sleep)(delayMs, options.signal);
    options.signal?.throwIfAborted();
    return run();
  }
}
