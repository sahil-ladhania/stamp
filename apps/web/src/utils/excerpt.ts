/**
 * File: excerpt.ts
 * Purpose: A short, single-line piece of a text, for an accessible name that must tell many similar controls apart.
 * Exports: excerpt
 * Used by: components/guide/ReportClaim.tsx
 */

/** Collapses whitespace and cuts at `max` characters with an ellipsis. */
export function excerpt(text: string, max = 60): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}
