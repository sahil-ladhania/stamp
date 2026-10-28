/**
 * File: format-wait.ts
 * Purpose: Turns a wait in seconds into the plain phrase used in rate-limit messages.
 * Exports: formatWait
 * Used by: middleware/rate-limit.ts
 */

const SECONDS_PER_MINUTE = 60;

/** "a minute" up to 60 seconds, then whole minutes rounded up ("3 minutes"). */
export function formatWait(seconds: number): string {
  if (seconds <= SECONDS_PER_MINUTE) {
    return "a minute";
  }
  return `${Math.ceil(seconds / SECONDS_PER_MINUTE)} minutes`;
}
