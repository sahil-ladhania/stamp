/**
 * File: start-of-utc-day.ts
 * Purpose: Midnight UTC of the day a date falls on; the daily run cap resets there.
 * Exports: startOfUtcDay
 * Used by: services/run-cap.ts
 */

/** Returns a new Date at 00:00:00.000 UTC on the same UTC calendar day. */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
