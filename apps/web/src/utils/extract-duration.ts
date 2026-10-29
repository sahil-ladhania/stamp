/**
 * File: extract-duration.ts
 * Purpose: Finds a stated duration ("3 to 7 days", "under two minutes") in the text of a claim. It reads text only:
 *          it never estimates, so a claim with no stated duration gives null.
 * Exports: extractDuration
 * Used by: utils/milestone-durations.ts, utils/library-times.ts
 */

const NUMBER_WORDS = 'one|two|three|four|five|six|seven|eight|nine|ten|twelve'
const QUALIFIER = '(?:under|about|around|within|up to|less than|more than|over|at least|roughly|approximately)'
const NUMBER = `(?:\\d+(?:\\.\\d+)?|${NUMBER_WORDS})`
const UNIT = '(?:minutes?|mins?|hours?|hrs?|business days?|days?|weeks?|months?)'
const PATTERN = new RegExp(
  `\\b(?:${QUALIFIER}\\s+)?${NUMBER}(?:\\s*(?:to|or|-|–)\\s*${NUMBER})?\\s*${UNIT}\\b`,
  'i',
)

/** The first duration phrase in the text, as written, or null when the text states none. */
export function extractDuration(text: string): string | null {
  const match = PATTERN.exec(text)
  return match ? match[0].trim() : null
}
