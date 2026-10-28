/**
 * File: index.ts
 * Purpose: The five library guides and lookups over them (mock stand-in for GET /api/guides).
 * Exports: LIBRARY_GUIDES, LIBRARY_SUMMARIES, getMockGuide, findLibrarySlug, toSummary
 * Used by: hooks/useMockSearch.ts, App home, Landing, Guide page
 */
import type { Guide, GuideSummary } from '../types'
import { githubGuide } from './github'
import { gmailGuide } from './gmail'
import { hubspotGuide } from './hubspot'
import { linkedinGuide } from './linkedin'
import { salesforceGuide } from './salesforce'

export const LIBRARY_GUIDES: readonly Guide[] = [githubGuide, hubspotGuide, gmailGuide, linkedinGuide, salesforceGuide]

/** Drops a guide down to the fields the list endpoint will return, plus the headline. */
export function toSummary(guide: Guide): GuideSummary {
  const { slug, appName, archetype, mode, asOf, headline, difficulty } = guide
  return { slug, appName, archetype, mode, asOf, headline, difficulty: difficulty.score }
}

export const LIBRARY_SUMMARIES: readonly GuideSummary[] = LIBRARY_GUIDES.map(toSummary)

/** Looks a guide up by slug. Undefined means the page shows its not-found state. */
export function getMockGuide(slug: string): Guide | undefined {
  return LIBRARY_GUIDES.find((guide) => guide.slug === slug)
}

/** Matches a typed name or slug to a library slug, ignoring case and spaces. */
export function findLibrarySlug(query: string): string | null {
  const normalized = query.trim().toLowerCase()
  const match = LIBRARY_GUIDES.find(
    (guide) => guide.slug === normalized || guide.appName.toLowerCase() === normalized,
  )
  return match ? match.slug : null
}
