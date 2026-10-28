/**
 * File: registrable-domain.ts
 * Purpose: Reads domains out of what a user typed: the host of a URL or domain, its registrable domain and its brand label.
 * Exports: hostFromTyped, registrableDomain, domainLabel
 * Used by: utils/slugify.ts, agent/resolve/typed-input.ts, agent/resolve/candidates.ts
 */

// Second-level suffixes where the registrable domain has one more label (bbc.co.uk).
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

function labelsOf(host: string): string[] {
  return host
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "")
    .split(".");
}

/** How many labels from the right make the registrable domain. */
function registrableLabels(labels: string[]): number {
  return TWO_PART_SUFFIXES.has(labels.slice(-2).join(".")) ? 3 : 2;
}

/** The host of a typed URL or domain, lowercase and without "www."; null when the text is an app name. */
export function hostFromTyped(input: string): string | null {
  const value = input.trim().toLowerCase();
  const hasScheme = SCHEME.test(value);
  if (!hasScheme && !DOMAIN_LIKE.test(value)) {
    return null;
  }
  try {
    return new URL(hasScheme ? value : `https://${value}`).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return null;
  }
}

/** "developers.hubspot.com" -> "hubspot.com"; "docs.bbc.co.uk" -> "bbc.co.uk". A heuristic: no public suffix list. */
export function registrableDomain(host: string): string {
  const labels = labelsOf(host);
  return labels.slice(-registrableLabels(labels)).join(".");
}

/** The brand label of a host: "developers.hubspot.com" -> "hubspot". */
export function domainLabel(host: string): string {
  const labels = labelsOf(host);
  return labels.at(-registrableLabels(labels)) ?? labels[0] ?? host;
}
