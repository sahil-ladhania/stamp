/**
 * File: with-timeout.ts
 * Purpose: Rejects when a promise takes longer than a time limit.
 * Exports: withTimeout, TimeoutError
 * Used by: services/run-executor.ts, agent clients (later)
 */

/** Thrown by withTimeout; the underlying work is not cancelled, only abandoned. */
export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/** Races the promise against a timer; pass an AbortSignal to the work if it can stop early. */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
