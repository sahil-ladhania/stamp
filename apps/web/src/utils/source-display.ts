/**
 * File: source-display.ts
 * Purpose: The pieces of a source chip made from its URL: the domain, an initial for the tile, and a short title.
 *          No favicon is fetched: that would send every domain to a third party.
 * Exports: sourceDomain, sourceInitial, sourceShortTitle
 * Used by: components/shared/SourceChip.tsx
 */

const SECOND_LEVEL = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac'])

function parse(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/** "https://www.docs.example.com/a" becomes "docs.example.com". A string that is not a URL is returned as it is. */
export function sourceDomain(url: string): string {
  return parse(url)?.host.replace(/^www\./, '') ?? url
}

/** The first letter of the name part of the domain: "developers.notion.com" gives "N", "bbc.co.uk" gives "B". */
export function sourceInitial(url: string): string {
  const labels = sourceDomain(url).split('.')
  const last = labels.at(-1) ?? ''
  const hasSecondLevel = labels.length >= 3 && last.length === 2 && SECOND_LEVEL.has(labels.at(-2) ?? '')
  const name = hasSecondLevel ? labels.at(-3) : (labels.at(-2) ?? labels[0])
  return (name ?? '?').charAt(0).toUpperCase()
}

/** The last path segment made readable: ".../workspace-scopes" gives "Workspace scopes". Empty when there is none. */
export function sourceShortTitle(url: string): string {
  const segments = (parse(url)?.pathname ?? '').split('/').filter(Boolean)
  const raw = segments.at(-1) ?? ''
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    // A malformed escape stays as typed.
  }
  const words = decoded.replace(/\.(html?|md|php)$/i, '').replace(/[-_]+/g, ' ').trim()
  if (words === '' || /^\d+$/.test(words)) return ''
  return words.charAt(0).toUpperCase() + words.slice(1)
}
