/**
 * File: app-name.ts
 * Purpose: The app name the Live run page shows. The stream carries no name, so it comes from the best source there is: the saved
 *          guide's own name once the run is done, then what the visitor typed (`?app=`) made readable, then the run's slug.
 * Exports: slugToName, displayNameFromTyped, resolveRunAppName
 * Used by: components/run/RunScreen.tsx
 */

const SECOND_LEVEL = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac'])

function titleCase(text: string): string {
  return text
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** "stub-check" becomes "Stub Check". Only for display: a slug is never sent back as a name. */
export function slugToName(slug: string): string {
  return titleCase(slug)
}

/** "https://www.docs.microsoft.com/a" gives "microsoft". Null when the text is not a domain or a URL. */
function nameFromDomain(raw: string): string | null {
  const host = (raw.replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0] ?? '').toLowerCase()
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) return null
  const labels = host.split('.')
  const last = labels.at(-1) ?? ''
  const hasSecondLevel = labels.length >= 3 && last.length === 2 && SECOND_LEVEL.has(labels.at(-2) ?? '')
  return (hasSecondLevel ? labels.at(-3) : labels.at(-2)) ?? null
}

/**
 * What the visitor typed, made readable. A domain or URL gives its name ("microsoft.com" gives "Microsoft"). Text with a capital
 * is the visitor's own casing and stays as typed ("HubSpot"); all lower case is title-cased.
 */
export function displayNameFromTyped(typed: string | null): string | null {
  const raw = typed?.trim() ?? ''
  if (raw === '') return null
  const name = nameFromDomain(raw) ?? raw
  return /[A-Z]/.test(name) ? name : titleCase(name)
}

type NameSources = { guideName: string | null; typed: string | null; slug: string | null }

export function resolveRunAppName({ guideName, typed, slug }: NameSources): string | null {
  const fromGuide = guideName?.trim()
  if (fromGuide) return fromGuide
  const fromTyped = displayNameFromTyped(typed)
  if (fromTyped) return fromTyped
  const fromSlug = slug ? slugToName(slug) : ''
  return fromSlug === '' ? null : fromSlug
}
