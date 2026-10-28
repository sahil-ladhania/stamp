/**
 * File: sleep.ts
 * Purpose: Waits for a number of milliseconds, ending early when an AbortSignal fires.
 * Exports: sleep
 * Used by: services/run-stream.ts
 */

/** Resolves after `ms` or as soon as the signal aborts; never rejects. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const finish = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal?.addEventListener("abort", finish, { once: true });
  });
}
