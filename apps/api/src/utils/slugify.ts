/**
 * File: slugify.ts
 * Purpose: Turns what a user typed (app name or URL) into the lowercase slug used for guides and run locks.
 * Exports: slugify
 * Used by: services/runs.ts
 */

// Second-level suffixes where the app name is one label further left (bbc.co.uk -> bbc).
const TWO_PART_SUFFIXES = new Set([
  "co.uk",
  "com.au",
  "co.in",
  "co.jp",
  "co.nz",
  "co.za",
  "com.br",
  "com.sg",
]);
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//;
const DOMAIN_LIKE = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/:?#].*)?$/;
const MAX_SLUG_LENGTH = 100;

/** The app name inside a hostname: "developers.hubspot.com" -> "hubspot". */
function appLabelFromHost(hostname: string): string {
  const labels = hostname.replace(/^www\./, "").split(".");
  const suffix = labels.slice(-2).join(".");
  const offset = TWO_PART_SUFFIXES.has(suffix) ? 3 : 2;
  return labels.at(-offset) ?? labels[0] ?? hostname;
}

function appLabelFromUrl(value: string): string | null {
  if (!SCHEME.test(value) && !DOMAIN_LIKE.test(value)) {
    return null;
  }
  try {
    const url = new URL(SCHEME.test(value) ? value : `https://${value}`);
    return appLabelFromHost(url.hostname);
  } catch {
    return null;
  }
}

/** Lowercase, hyphen-separated slug; empty when the input has no letters or digits. */
export function slugify(input: string): string {
  const value = input.trim().toLowerCase();
  const base = appLabelFromUrl(value) ?? value;
  return base
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
}
