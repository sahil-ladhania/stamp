/**
 * File: format-date.ts
 * Purpose: Formats a guide's ISO as-of date for display.
 * Exports: formatAsOf
 * Used by: components/shared/AppCard.tsx, guide sections
 */

// UTC keeps the day stable for every reader, whatever their time zone.
const formatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Turns `2026-10-28` into `28 Oct 2026`. */
export function formatAsOf(isoDate: string): string {
  return formatter.format(new Date(isoDate))
}
