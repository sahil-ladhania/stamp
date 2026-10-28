/**
 * File: map-source.ts
 * Purpose: Maps a wire source to the UI source. The wire source has no title, so one is made from its URL.
 * Exports: sourceTitle, mapSource
 * Used by: utils/map-claim.ts, utils/map-conflicts.ts, utils/collect-sources.ts
 */
import type { Source as WireSource } from '@stamp/schema'
import type { Source } from '@/types/guide-model'

const MAX_TITLE_LENGTH = 60

/** "https://www.docs.example.com/oauth/" becomes "docs.example.com/oauth". A string that is not a URL is returned as is. */
export function sourceTitle(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  const host = parsed.host.replace(/^www\./, '')
  const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '')
  const title = `${host}${path}`
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1)}…` : title
}

export function mapSource(source: WireSource): Source {
  return {
    url: source.url,
    title: sourceTitle(source.url),
    tier: source.tier,
    quote: source.quote,
    retrievedAt: source.retrievedAt,
  }
}
