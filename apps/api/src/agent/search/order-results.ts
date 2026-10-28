/**
 * File: order-results.ts
 * Purpose: Turns Tavily hits into tiered search results and orders them: official first, then third party, then forum, then by score.
 * Exports: toSearchResults, orderResults
 * Used by: agent/nodes/search.ts, agent/fetch/select-pages.ts
 */
import type { SourceTier } from "@stamp/schema";
import { sourceTier } from "../evidence/source-tier.js";
import type { SearchHit } from "../../lib/tavily.js";
import type { SearchResult } from "../search-result.js";

const TIER_RANK: Record<SourceTier, number> = {
  official: 0,
  third_party: 1,
  forum: 2,
};

/** Tier each hit against the official domain and drop repeats of the same URL, keeping the first. */
export function toSearchResults(
  hits: SearchHit[],
  domain: string,
): SearchResult[] {
  const seen = new Set<string>();
  const results: SearchResult[] = [];
  for (const hit of hits) {
    if (seen.has(hit.url)) {
      continue;
    }
    seen.add(hit.url);
    results.push({
      url: hit.url,
      tier: sourceTier(hit.url, domain),
      ...(hit.title === "" ? {} : { title: hit.title }),
      score: hit.score,
    });
  }
  return results;
}

/** Official before third party before forum; within a tier, higher score first. Equal results keep their order. */
export function orderResults(results: SearchResult[]): SearchResult[] {
  return [...results].sort(
    (a, b) =>
      TIER_RANK[a.tier] - TIER_RANK[b.tier] || (b.score ?? 0) - (a.score ?? 0),
  );
}
