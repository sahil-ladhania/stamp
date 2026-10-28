/**
 * File: select-pages.ts
 * Purpose: Chooses which search results to fetch: official pages first, one slot kept for a non-official page, no repeats.
 * Exports: selectPages, isFetchable, MIN_PAGE_CHARS
 * Used by: agent/nodes/fetch.ts, agent/fetch/load-pages.ts
 */
import { hashUrl } from "../../utils/hash-url.js";
import { orderResults } from "../search/order-results.js";
import type { SearchResult } from "../search-result.js";

/** A page with less text than this is a login wall or an empty shell, not documentation. */
export const MIN_PAGE_CHARS = 300;

const SKIP_EXTENSION =
  /\.(?:png|jpe?g|gif|svg|webp|ico|mp4|mov|zip|gz|tgz|dmg|exe|csv|xlsx?)$/i;
const SKIP_PATH = /\/(?:log-?in|sign-?in|sign-?up|register)(?:\/|$)/i;

/** False for non-http URLs, images, archives and login pages. */
export function isFetchable(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      !SKIP_EXTENSION.test(parsed.pathname) &&
      !SKIP_PATH.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Up to `allowance` new pages, official first. With room for 3 or more, one slot is kept for the best
 * non-official page (a second voice, for conflict checks) when there is one; otherwise official pages
 * take every slot. `held` holds the URL hashes of pages the run already has.
 */
export function selectPages(
  results: SearchResult[],
  options: { allowance: number; held: ReadonlySet<string> },
): SearchResult[] {
  const seen = new Set(options.held);
  const fresh = orderResults(results).filter((result) => {
    if (!isFetchable(result.url)) {
      return false;
    }
    const id = hashUrl(result.url);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
  const official = fresh.filter((result) => result.tier === "official");
  const other = fresh.filter((result) => result.tier !== "official");

  const allowance = Math.max(0, options.allowance);
  const reserve = allowance >= 3 && other.length > 0 ? 1 : 0;
  const officialPicked = official.slice(0, Math.max(0, allowance - reserve));
  const otherPicked = other.slice(0, allowance - officialPicked.length);
  return [...officialPicked, ...otherPicked];
}
