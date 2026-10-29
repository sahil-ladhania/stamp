/**
 * File: select-pages.ts
 * Purpose: Chooses which search results to fetch: official pages by relevance with topic coverage, a reserved slot for a non-official page that answers a topic, no repeats.
 * Exports: selectPages, isFetchable, MIN_PAGE_CHARS
 * Used by: agent/nodes/fetch.ts, agent/fetch/load-pages.ts
 */
import { hashUrl } from "../../utils/hash-url.js";
import { nameKey } from "../../utils/name-key.js";
import { canonicalKey, isEnglishVariant } from "../search/canonical-url.js";
import type { SearchResult } from "../search-result.js";
import { relevance, topicFit, type RelevanceContext } from "./relevance.js";

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

/** What a page not yet covered by a chosen one is worth, in relevance points, per topic and for at most two topics. */
const COVERAGE_BONUS = 1.5;
const MAX_COVERED_TOPICS = 2;
/** A non-official page earns the reserved slot only when its title answers one of its topics and it scores at least this. */
const RESERVE_FLOOR = 3;

const TIER_RANK: Record<SearchResult["tier"], number> = {
  official: 0,
  third_party: 1,
  forum: 2,
};

/**
 * Up to `count` pages from the pool, best first: each round takes the result with the highest relevance plus a
 * bonus for the topics no chosen page covers yet, so the pages together answer as many topics as they can.
 * Ties keep the pool's order.
 */
function pickBest(
  pool: SearchResult[],
  count: number,
  context: RelevanceContext,
): SearchResult[] {
  const remaining = [...pool];
  const covered = new Set<string>();
  const chosen: SearchResult[] = [];
  while (chosen.length < count && remaining.length > 0) {
    let best = 0;
    let bestScore = -Infinity;
    remaining.forEach((result, index) => {
      const fresh = (result.topics ?? []).filter((t) => !covered.has(t)).length;
      const score =
        relevance(result, context) +
        COVERAGE_BONUS * Math.min(fresh, MAX_COVERED_TOPICS);
      if (score > bestScore) {
        best = index;
        bestScore = score;
      }
    });
    const [picked] = remaining.splice(best, 1);
    if (picked) {
      chosen.push(picked);
      (picked.topics ?? []).forEach((topic) => covered.add(topic));
    }
  }
  return chosen;
}

/**
 * Up to `allowance` new pages. Official pages are chosen by relevance with topic coverage (`pickBest`). With
 * room for 3 or more, one slot is kept for a non-official page (a second voice, for conflict checks), but only
 * one that answers a topic; otherwise official pages take every slot, and leftover slots go to non-official
 * pages, third party before forum. A page in two languages counts once, the English one first. `held` holds
 * the URL hashes of pages the run already has.
 */
export function selectPages(
  results: SearchResult[],
  options: {
    allowance: number;
    held: ReadonlySet<string>;
    product?: string | null;
    /** The app's name: a non-official page takes the reserved slot only if its title or address names the app or its product. */
    appName?: string;
    /** True on a retry whose review gate is unknown. */
    gateFirst?: boolean;
  },
): SearchResult[] {
  const context: RelevanceContext = {
    product: options.product ?? null,
    gateFirst: options.gateFirst === true,
  };
  const namesApp = (result: SearchResult): boolean => {
    const keys = [options.appName, options.product ?? undefined]
      .map((name) => nameKey(name ?? ""))
      .filter((key) => key !== "");
    const haystack = nameKey(`${result.title ?? ""} ${result.url}`);
    return keys.length === 0 || keys.some((key) => haystack.includes(key));
  };
  const seen = new Set(options.held);
  const seenPages = new Set<string>();
  const english = [...results].sort(
    (a, b) => Number(isEnglishVariant(b.url)) - Number(isEnglishVariant(a.url)),
  );
  const fresh = english.filter((result) => {
    if (!isFetchable(result.url)) {
      return false;
    }
    const id = hashUrl(result.url);
    const page = canonicalKey(result.url);
    if (seen.has(id) || seenPages.has(page)) {
      return false;
    }
    seen.add(id);
    seenPages.add(page);
    return true;
  });
  const official = fresh.filter((result) => result.tier === "official");
  const other = fresh
    .filter((result) => result.tier !== "official")
    .sort(
      (a, b) =>
        TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
        relevance(b, context) - relevance(a, context),
    );

  const allowance = Math.max(0, options.allowance);
  const reservable =
    allowance >= 3
      ? other.filter(
          (result) =>
            topicFit(result) >= 2 &&
            relevance(result, context) >= RESERVE_FLOOR &&
            namesApp(result),
        )
      : [];
  const reserved = reservable.slice(0, 1);
  const officialPicked = pickBest(
    official,
    allowance - reserved.length,
    context,
  );
  const filler = other
    .filter((result) => !reserved.includes(result))
    .slice(0, allowance - officialPicked.length - reserved.length);
  return [...officialPicked, ...reserved, ...filler];
}
