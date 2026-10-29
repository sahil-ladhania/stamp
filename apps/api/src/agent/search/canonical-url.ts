/**
 * File: canonical-url.ts
 * Purpose: Builds a key that makes the language and tracking variants of one page compare equal, and tells whether a URL is the English variant.
 * Exports: canonicalKey, isEnglishVariant
 * Used by: agent/search/order-results.ts, agent/fetch/select-pages.ts
 */

/** Languages that appear as a first path segment of a localised site ("/es-es/help/..."). Ambiguous words such as "id" and "no" are left out. */
const LANGUAGES: ReadonlySet<string> = new Set([
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "ja",
  "ko",
  "zh",
  "ru",
  "nl",
  "sv",
  "pl",
  "tr",
  "cs",
  "da",
  "fi",
  "nb",
  "hu",
  "uk",
  "vi",
  "th",
]);
const LOCALE_SEGMENT = /^([a-z]{2})(?:-[a-z]{2,4})?$/i;
const IGNORED_PARAMS = /^(?:hl|lang|locale|utm_.*|gclid|fbclid|ref)$/i;

/** The language of a path segment such as "en-us" or "zh-cn", or null when the segment is not a locale. */
function languageOf(segment: string | undefined): string | null {
  const language = LOCALE_SEGMENT.exec(segment ?? "")?.[1]?.toLowerCase();
  return language !== undefined && LANGUAGES.has(language) ? language : null;
}

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * "docs.github.com/en/apps/x" and "docs.github.com/apps/x" give the same key, and so do the three languages
 * of one help article. The host, path and case are normalised, and language, tracking and fragment parts are
 * dropped; other parameters stay, since they can pick a different page. Text that is not a URL is returned as is.
 */
export function canonicalKey(url: string): string {
  const parsed = parse(url);
  if (parsed === null) {
    return url;
  }
  const segments = parsed.pathname.split("/").filter((s) => s !== "");
  const path = (languageOf(segments[0]) ? segments.slice(1) : segments).join(
    "/",
  );
  const params = [...parsed.searchParams.entries()]
    .filter(([name]) => !IGNORED_PARAMS.test(name))
    .map(([name, value]) => `${name}=${value}`)
    .sort()
    .join("&");
  const host = parsed.hostname.replace(/^www\./, "");
  return `${host}/${path}${params === "" ? "" : `?${params}`}`
    .toLowerCase()
    .replace(/\/$/, "");
}

/** True when the URL has no locale segment or an English one. */
export function isEnglishVariant(url: string): boolean {
  const first = parse(url)
    ?.pathname.split("/")
    .find((s) => s !== "");
  const language = languageOf(first);
  return language === null || language === "en";
}
