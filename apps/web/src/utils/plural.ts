/**
 * File: plural.ts
 * Purpose: Counts a regular noun: `1 page`, `4 pages`.
 * Exports: pluralize
 * Used by: components/run/run-copy.ts
 */

/** Adds an "s" for every count except 1. Only for regular nouns. */
export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
