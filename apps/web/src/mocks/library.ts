/**
 * File: library.ts
 * Purpose: TEMPORARY: the five library summaries that the Landing and Not found pages still read until they are
 *          wired to the API. Deleted with the last of those pages.
 * Exports: LIBRARY_SUMMARIES, findLibrarySlug
 * Used by: components/landing/Hero.tsx, components/landing/KindsOfHardSection.tsx, components/not-found/NotFoundPanel.tsx,
 *          utils/not-found-hint.ts, hooks/useMockSearch.ts
 */
import type { GuideSummary } from '@stamp/schema'

const AS_OF = '2026-10-28T00:00:00.000Z'

export const LIBRARY_SUMMARIES: readonly GuideSummary[] = [
  { slug: 'github', appName: 'GitHub', archetype: 'instant', difficulty: 1, mode: 'library', asOf: AS_OF },
  { slug: 'hubspot', appName: 'HubSpot', archetype: 'hidden_limits', difficulty: 4, mode: 'library', asOf: AS_OF },
  { slug: 'gmail', appName: 'Gmail', archetype: 'review', difficulty: 3, mode: 'library', asOf: AS_OF },
  { slug: 'linkedin', appName: 'LinkedIn', archetype: 'partner_gated', difficulty: 4, mode: 'library', asOf: AS_OF },
  { slug: 'salesforce', appName: 'Salesforce', archetype: 'enterprise', difficulty: 2, mode: 'library', asOf: AS_OF },
]

/** Matches a typed name or slug to a library slug, ignoring case and spaces. */
export function findLibrarySlug(query: string): string | null {
  const normalized = query.trim().toLowerCase()
  const match = LIBRARY_SUMMARIES.find(
    (guide) => guide.slug === normalized || guide.appName.toLowerCase() === normalized,
  )
  return match ? match.slug : null
}
