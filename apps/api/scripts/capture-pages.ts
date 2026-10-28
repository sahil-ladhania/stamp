/**
 * File: capture-pages.ts
 * Purpose: Pure helpers for the fixture capture: tier by official domains, which pages to fetch, and the page text cap.
 * Exports: tierOf, pickPageUrls, capPages
 * Used by: scripts/capture-run.ts
 */
import type { SourceTier } from "@stamp/schema";
import { sourceTier } from "../src/agent/evidence/source-tier.js";
import type { ExtractResult, SearchResult } from "../src/lib/tavily.js";

/** Official if the URL is on any of the app's domains; forum beats official, as in the real tiering. */
export function tierOf(url: string, domains: string[]): SourceTier {
  const tiers = domains.map((domain) => sourceTier(url, domain));
  if (tiers.includes("official")) {
    return "official";
  }
  return tiers.includes("forum") ? "forum" : "third_party";
}

/**
 * Up to `max` pages: official hits taken round-robin across the topic searches (each topic's best page
 * first), plus one page from outside the official domains when the open search found one.
 */
export function pickPageUrls(
  topics: SearchResult[],
  open: SearchResult | null,
  domains: string[],
  max: number,
): string[] {
  const isOfficial = (url: string): boolean =>
    tierOf(url, domains) === "official";
  const outside = open?.hits.find((hit) => !isOfficial(hit.url))?.url;
  const officialSlots = outside === undefined ? max : max - 1;
  const ranked = topics.map((topic) =>
    topic.hits.map((hit) => hit.url).filter(isOfficial),
  );

  const picked: string[] = [];
  for (let rank = 0; picked.length < officialSlots; rank++) {
    const row = ranked
      .map((urls) => urls[rank])
      .filter((url) => url !== undefined);
    if (row.length === 0) {
      break;
    }
    for (const url of row) {
      if (picked.length < officialSlots && !picked.includes(url)) {
        picked.push(url);
      }
    }
  }
  if (outside !== undefined && !picked.includes(outside)) {
    picked.push(outside);
  }
  return picked;
}

/** Cuts each page's text to `cap` characters and records the full length of every page that was cut. */
export function capPages(
  result: ExtractResult,
  cap: number,
): {
  result: ExtractResult;
  truncated: { url: string; originalLength: number }[];
} {
  const truncated: { url: string; originalLength: number }[] = [];
  const pages = result.pages.map((page) => {
    if (page.text.length <= cap) {
      return page;
    }
    truncated.push({ url: page.url, originalLength: page.text.length });
    return { ...page, text: page.text.slice(0, cap) };
  });
  return { result: { ...result, pages }, truncated };
}
