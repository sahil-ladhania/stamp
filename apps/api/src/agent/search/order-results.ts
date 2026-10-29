/**
 * File: order-results.ts
 * Purpose: Turns Tavily hits into tiered search results (tiered against every official domain) and orders them: official first, then third party, then forum, then by score.
 * Exports: toSearchResults, orderResults
 * Used by: agent/nodes/search.ts, agent/fetch/select-pages.ts
 */
import type { SourceTier } from "@stamp/schema";
import { sourceTier, type OfficialDomains } from "../evidence/source-tier.js";
import type { SearchHit } from "../../lib/tavily.js";
import type { SearchResult } from "../search-result.js";

const TIER_RANK: Record<SourceTier, number> = {
  official: 0,
  third_party: 1,
  forum: 2,
};

/** A hit with the topic of the planned query that returned it, when there is one. */
export type TaggedHit = SearchHit & { topic?: string };

/**
 * Tier each hit against the official domain and drop repeats of the same URL, keeping the first.
 * A repeat still adds its query's topic to the kept result, so a result lists every topic that found it.
 */
export function toSearchResults(
  hits: TaggedHit[],
  domains: OfficialDomains,
): SearchResult[] {
  const byUrl = new Map<string, SearchResult>();
  for (const hit of hits) {
    const kept = byUrl.get(hit.url);
    if (kept) {
      if (hit.topic !== undefined && !kept.topics?.includes(hit.topic)) {
        kept.topics = [...(kept.topics ?? []), hit.topic];
      }
      continue;
    }
    byUrl.set(hit.url, {
      url: hit.url,
      tier: sourceTier(hit.url, domains),
      ...(hit.title === "" ? {} : { title: hit.title }),
      score: hit.score,
      ...(hit.topic === undefined ? {} : { topics: [hit.topic] }),
    });
  }
  return [...byUrl.values()];
}

/** Official before third party before forum; within a tier, higher score first. Equal results keep their order. */
export function orderResults(results: SearchResult[]): SearchResult[] {
  return [...results].sort(
    (a, b) =>
      TIER_RANK[a.tier] - TIER_RANK[b.tier] || (b.score ?? 0) - (a.score ?? 0),
  );
}
