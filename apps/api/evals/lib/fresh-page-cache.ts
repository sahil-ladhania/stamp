/**
 * File: fresh-page-cache.ts
 * Purpose: A page cache that never remembers: every eval run fetches its pages fresh, so credits, time and page text are comparable between runs and nothing is written to the database.
 * Exports: freshPageCache
 * Used by: evals/lib/run-one.ts
 */
import type { PageCachePort } from "../../src/agent/page-record.js";
import { hashUrl, normalizeUrl } from "../../src/utils/hash-url.js";
import { sha256Hex } from "../../src/utils/sha256.js";

/** `get` always misses. `store` returns the record the database cache would, already expired, and keeps nothing. */
export function freshPageCache(
  now: () => Date = () => new Date(),
): PageCachePort {
  return {
    get: () => Promise.resolve(null),
    store: ({ url, tier, text }) => {
      if (text.trim() === "") {
        return Promise.reject(
          new RangeError("Cannot cache a page with no text"),
        );
      }
      const normal = normalizeUrl(url);
      const fetchedAt = now().toISOString();
      return Promise.resolve({
        url: normal,
        urlHash: hashUrl(normal),
        tier,
        text,
        contentHash: sha256Hex(text),
        fetchedAt,
        expiresAt: fetchedAt,
      });
    },
  };
}
