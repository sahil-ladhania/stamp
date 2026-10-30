/**
 * File: scope-checks.ts
 * Purpose: Code rules for whether a name the model called an OAuth scope is one, using only the name and the fetched page: the page text holds it, it is not a placeholder, a half name or a bare host, and it does not come from an admin page.
 * Exports: isRealScope, looksLikeScopeName
 * Used by: agent/extract/sanitize.ts, library/check-guide.ts
 */
import type { SourceTier } from "@stamp/schema";
import { normalizeText } from "../../utils/normalize-text.js";

const MAX_NAME_CHARS = 120;
const PLACEHOLDER =
  /[<>{}[\]*]|^\.+$|^(?:your|my|example|sample|test|placeholder)(?:[_.:-]|$)|(?:^|[_.:-])(?:xxx+|placeholder|example|scope_?name(?:_here)?)$/i;
/** A name that stops on a separator is half of a template ("session:role:"); one that starts with a slash is a piece of a URL ("/.default"). */
const UNFINISHED = /[:_-]$|^\//;
const BARE_HOST =
  /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|net|io|dev|co|app)$/i;
/** A path segment that names an admin surface: an organisation's administration, not an app's own permissions. */
const ADMIN_SEGMENT = /^(?:admins?|administration)$/i;

const onAdminPage = (url: string): boolean => {
  try {
    return new URL(url).pathname
      .split("/")
      .some((segment) => ADMIN_SEGMENT.test(segment));
  } catch {
    return false;
  }
};

/**
 * True when the name looks like a scope the provider defines for an app to request, judged without the page text: not
 * a placeholder, a half name, a URL fragment or a bare host, and not from an admin page. A name with spaces is kept
 * only from an official page (some providers name capabilities in words). Pages about administration give scopes for a
 * different surface (an organisation's admin API), so their names are not the app's scopes.
 */
export function looksLikeScopeName(
  name: string,
  page: { url: string; tier: SourceTier },
): boolean {
  const trimmed = name.trim();
  if (trimmed === "" || trimmed.length > MAX_NAME_CHARS) return false;
  if (PLACEHOLDER.test(trimmed) || UNFINISHED.test(trimmed)) return false;
  if (!/^https?:\/\//i.test(trimmed) && BARE_HOST.test(trimmed)) return false;
  if (/\s/.test(trimmed) && page.tier !== "official") return false;
  return !onAdminPage(page.url);
}

/**
 * True when the name looks like a scope (see `looksLikeScopeName`) and is written on the page (the reason's quote may
 * sit in another table cell, so the page text is checked, not the quote).
 */
export function isRealScope(
  name: string,
  pageText: string,
  page: { url: string; tier: SourceTier },
): boolean {
  return (
    looksLikeScopeName(name, page) &&
    normalizeText(pageText).includes(normalizeText(name.trim()))
  );
}
