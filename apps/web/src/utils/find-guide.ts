/**
 * File: find-guide.ts
 * Purpose: Matches a typed name or a slug to a guide in the loaded library list, ignoring case and spaces.
 *          Name matching for routing only; there is no search here.
 * Exports: findGuide
 * Used by: utils/not-found-hint.ts
 */
import type { GuideSummary } from '@stamp/schema'

/** The guide whose slug or app name equals the query, or undefined. */
export function findGuide(guides: readonly GuideSummary[], query: string): GuideSummary | undefined {
  const normalized = query.trim().toLowerCase()
  if (normalized === '') return undefined
  return guides.find(
    (guide) => guide.slug === normalized || guide.appName.toLowerCase() === normalized,
  )
}
