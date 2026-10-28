/**
 * File: app-name.ts
 * Purpose: The app name the Live run page shows: what the visitor typed (`?app=`), or the run's slug made readable.
 * Exports: slugToName, resolveAppName
 * Used by: components/run/RunScreen.tsx
 */

/** "stub-check" becomes "Stub Check". Only for display: a slug is never sent back as a name. */
export function slugToName(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** The typed name wins; the slug is the fallback for a shared or refreshed link with no `?app=`. */
export function resolveAppName(appParam: string | null, slug: string | null): string | null {
  const typed = appParam?.trim()
  if (typed) return typed
  const fromSlug = slug ? slugToName(slug) : ''
  return fromSlug === '' ? null : fromSlug
}
