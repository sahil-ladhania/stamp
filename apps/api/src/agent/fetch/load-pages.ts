/**
 * File: load-pages.ts
 * Purpose: Loads the chosen pages: from the 7-day page cache where fresh, the rest in one Tavily extract call, short pages dropped.
 * Exports: loadPages, LoadContext, Loaded
 * Used by: agent/nodes/fetch.ts
 */
import { logger } from "../../lib/logger.js";
import { extractPages } from "../../lib/tavily.js";
import type { RunUsage } from "../../lib/usage.js";
import { getCachedPage, storePage } from "../../services/page-cache.js";
import { errorText } from "../../utils/error-text.js";
import { hashUrl } from "../../utils/hash-url.js";
import { sourceTier } from "../evidence/source-tier.js";
import type { PageCachePort, PageRecord } from "../page-record.js";
import { MIN_PAGE_CHARS } from "./select-pages.js";

export type LoadContext = {
  /** The app's official domains; every page's tier is decided against them. */
  domains: readonly string[];
  timeoutMs: number;
  signal?: AbortSignal;
  usage: RunUsage;
  runId: string;
  /** Replaces the database page cache; absent in normal runs. */
  cache?: PageCachePort;
};

export type Loaded = {
  /** In the order the URLs were given. */
  pages: PageRecord[];
  cacheHits: number;
  fetched: number;
  /** Pages with too little text to be documentation, or not among those requested. */
  dropped: number;
  /** URLs Tavily could not extract. */
  failed: number;
  /** Set when the extract call itself failed (the cached pages are still returned). */
  extractError: string | null;
};

async function readCache(
  url: string,
  ctx: LoadContext,
): Promise<PageRecord | null> {
  try {
    return await (ctx.cache?.get ?? getCachedPage)(url);
  } catch (err) {
    ctx.signal?.throwIfAborted();
    logger.warn("page cache read failed", {
      runId: ctx.runId,
      detail: errorText(err),
    });
    return null;
  }
}

/** Stores a page; a failed cache write drops that page rather than the run. */
async function keep(
  page: { url: string; text: string },
  ctx: LoadContext,
): Promise<PageRecord | null> {
  try {
    return await (ctx.cache?.store ?? storePage)({
      url: page.url,
      tier: sourceTier(page.url, ctx.domains),
      text: page.text,
    });
  } catch (err) {
    ctx.signal?.throwIfAborted();
    logger.warn("page cache write failed", {
      runId: ctx.runId,
      detail: errorText(err),
    });
    return null;
  }
}

/** Cache hits first, then one extract call for the misses. Tiers are always decided here, against this app. */
export async function loadPages(
  urls: string[],
  ctx: LoadContext,
): Promise<Loaded> {
  const wanted = new Set(urls.map(hashUrl));
  const byHash = new Map<string, PageRecord>();
  const misses: string[] = [];
  const cached = await Promise.all(urls.map((url) => readCache(url, ctx)));
  urls.forEach((url, index) => {
    const hit = cached[index];
    if (hit) {
      byHash.set(hit.urlHash, {
        ...hit,
        tier: sourceTier(hit.url, ctx.domains),
      });
    } else {
      misses.push(url);
    }
  });
  const cacheHits = byHash.size;

  let fetched = 0;
  let dropped = 0;
  let failed = 0;
  let extractError: string | null = null;
  if (misses.length > 0) {
    try {
      const result = await extractPages(misses, {
        timeoutMs: ctx.timeoutMs,
        signal: ctx.signal,
        usage: ctx.usage,
        runId: ctx.runId,
      });
      failed = result.failed.length;
      for (const page of result.pages) {
        const usable =
          page.text.trim().length >= MIN_PAGE_CHARS &&
          wanted.has(hashUrl(page.url));
        const record = usable ? await keep(page, ctx) : null;
        if (record) {
          byHash.set(record.urlHash, record);
          fetched += 1;
        } else {
          dropped += 1;
        }
      }
    } catch (err) {
      ctx.signal?.throwIfAborted();
      extractError = errorText(err);
      logger.warn("page extract failed", {
        runId: ctx.runId,
        detail: extractError,
      });
    }
  }

  const pages = urls.flatMap((url) => byHash.get(hashUrl(url)) ?? []);
  return { pages, cacheHits, fetched, dropped, failed, extractError };
}
