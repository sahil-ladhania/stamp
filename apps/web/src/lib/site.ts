/**
 * File: site.ts
 * Purpose: Site-wide copy and the optional repository link for the footer. The repo URL is public config (VITE_REPO_URL):
 *          when it is unset, the footer simply leaves the Project group out.
 * Exports: SITE_TAGLINE, SITE_DISCLAIMER, resolveRepoUrl, REPO_URL
 * Used by: components/layout/SiteFooter.tsx
 */

export const SITE_TAGLINE = 'Know what it takes to get your OAuth app stamped.'
export const SITE_DISCLAIMER =
  'Every claim is labelled Tested, Sourced or Uncertain. Check the source before you rely on one.'

/** Null when unset. Rejects a value that is not an absolute http or https URL, so a typo fails loudly at startup. */
export function resolveRepoUrl(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') throw new TypeError('VITE_REPO_URL must be a string')
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (trimmed === '') return null
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new TypeError(`VITE_REPO_URL must be an absolute URL, got "${trimmed}"`)
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new TypeError('VITE_REPO_URL must start with http:// or https://')
  }
  return trimmed
}

export const REPO_URL = resolveRepoUrl(import.meta.env.VITE_REPO_URL)
