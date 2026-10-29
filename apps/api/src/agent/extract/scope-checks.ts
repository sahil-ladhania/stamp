/**
 * File: scope-checks.ts
 * Purpose: Code rules for whether a name the model called an OAuth scope is one, using only the name, its quote and the page: the quote holds it, it is not a placeholder, a half name or a bare host, and it does not come from an admin page.
 * Exports: isRealScope
 * Used by: agent/extract/sanitize.ts
 */
import type { SourceTier } from "@stamp/schema";
import { normalizeText } from "../../utils/normalize-text.js";

const MAX_NAME_CHARS = 120;
const PLACEHOLDER =
  /[<>{}[\]*]|^\.+$|^(?:your|my|example|sample|test|placeholder)(?:[_.:-]|$)|(?:^|[_.:-])(?:xxx+|placeholder|example|scope_?name(?:_here)?)$/i;
/** A name that stops on a separator is half of a template ("session:role:"). */
const UNFINISHED = /[:_-]$/;
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
 * True when the name looks like a scope the provider defines for an app to request. A name with spaces is
 * kept only from an official page (some providers name capabilities in words). Pages about administration
 * give scopes for a different surface (an organisation's admin API), so their names are not the app's scopes.
 */
export function isRealScope(
  name: string,
  quote: string,
  page: { url: string; tier: SourceTier },
): boolean {
  const trimmed = name.trim();
  if (trimmed === "" || trimmed.length > MAX_NAME_CHARS) return false;
  if (PLACEHOLDER.test(trimmed) || UNFINISHED.test(trimmed)) return false;
  if (!/^https?:\/\//i.test(trimmed) && BARE_HOST.test(trimmed)) return false;
  if (/\s/.test(trimmed) && page.tier !== "official") return false;
  if (onAdminPage(page.url)) return false;
  return normalizeText(quote).includes(normalizeText(trimmed));
}
