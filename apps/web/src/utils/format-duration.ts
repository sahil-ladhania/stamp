/**
 * File: format-duration.ts
 * Purpose: Formats milliseconds as seconds for stage times and the budget strip.
 * Exports: formatSeconds, formatSecondsInWords
 * Used by: components/run/*
 */

function secondsText(ms: number): string {
  const seconds = ms / 1000;
  return Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(1);
}

/** `600` becomes `0.6 s` and `120000` becomes `120 s`. */
export function formatSeconds(ms: number): string {
  return `${secondsText(ms)} s`;
}

/** `14600` becomes `14.6 seconds`, for sentences. */
export function formatSecondsInWords(ms: number): string {
  return `${secondsText(ms)} seconds`;
}
