/**
 * File: node-fixtures.ts
 * Purpose: Small inline builders for the node tests: an app identity, a search hit, a search result and a page record.
 * Exports: APP, hit, result, pageRecord, LONG_TEXT
 * Used by: agent/nodes/*.test.ts
 */
import type { SourceTier } from "@stamp/schema";
import type { SearchHit } from "../lib/tavily.js";
import type { AppIdentity } from "../agent/state.js";
import type { PageRecord } from "../agent/page-record.js";
import type { SearchResult } from "../agent/search-result.js";
import { hashUrl } from "../utils/hash-url.js";

export const APP: AppIdentity = {
  appName: "Acme",
  domain: "acme.com",
  slug: "acme",
};

/** Text long enough to count as a real page (300 characters or more). */
export const LONG_TEXT =
  "Create an app in the developer portal, then copy the client ID and secret. ".repeat(
    6,
  );

export function hit(url: string, score = 0.5, title = "Title"): SearchHit {
  return { url, title, snippet: "snippet", score };
}

export function result(
  url: string,
  tier: SourceTier,
  score = 0.5,
): SearchResult {
  return { url, tier, score };
}

export function pageRecord(
  url: string,
  tier: SourceTier = "official",
  text = LONG_TEXT,
): PageRecord {
  return {
    url,
    urlHash: hashUrl(url),
    tier,
    text,
    contentHash: `hash-of-${url}`,
    fetchedAt: "2026-03-05T10:00:00.000Z",
    expiresAt: "2026-03-12T10:00:00.000Z",
  };
}
