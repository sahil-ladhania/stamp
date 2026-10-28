/**
 * File: with-timeout.ts
 * Purpose: Rejects when a promise takes longer than a time limit or when an AbortSignal fires.
 * Exports: withTimeout, TimeoutError
 * Used by: services/run-executor.ts, lib/tavily.ts, agent nodes
 */

/** Thrown by withTimeout; the underlying work is not cancelled, only abandoned. */
export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Races the promise against a timer and, optionally, an AbortSignal (rejects with the signal's reason).
 * The work itself is not cancelled; clients with no abort support (Tavily) rely on this to stop waiting.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) {
    // The abandoned promise may still reject later; mark it handled.
    promise.catch(() => undefined);
    return Promise.reject(signal.reason);
  }
  let timer: NodeJS.Timeout | undefined;
  let onAbort: (() => void) | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  const aborted = new Promise<never>((_resolve, reject) => {
    if (signal) {
      onAbort = () => reject(signal.reason);
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
  return Promise.race([promise, timeout, aborted]).finally(() => {
    clearTimeout(timer);
    if (signal && onAbort) {
      signal.removeEventListener("abort", onAbort);
    }
  });
}
