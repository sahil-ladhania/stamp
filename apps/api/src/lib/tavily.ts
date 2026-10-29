/**
 * File: tavily.ts
 * Purpose: Tavily search and page extraction returning typed, validated results.
 * Exports: searchWeb, extractPages, SearchHit, ExtractedPage, SearchResult, ExtractResult, SearchOptions
 * Used by: agent/nodes/resolve.ts, agent/nodes/search.ts, agent/nodes/fetch.ts, scripts/smoke-live.ts
 */
import { z } from "zod";
import { rewriteLinks } from "../utils/markdown-links.js";
import {
  cleanUrl,
  getTavilyClient,
  parseOrThrow,
  request,
  type CallOptions,
} from "./tavily-client.js";

export type SearchHit = {
  /** Normalised http(s) URL. */
  url: string;
  title: string;
  snippet: string;
  score: number;
};
export type SearchResult = { hits: SearchHit[]; credits: number | null };

export type ExtractedPage = { url: string; title: string | null; text: string };
export type ExtractResult = {
  pages: ExtractedPage[];
  failed: { url: string; error: string }[];
  credits: number | null;
};

export type SearchOptions = CallOptions & {
  /** Restricts results to these domains (and their subdomains). */
  includeDomains?: string[];
  maxResults?: number;
};

/** The extract endpoint takes at most this many URLs here; the run's page budget is far lower (6). */
const MAX_EXTRACT_URLS = 10;
const DEFAULT_MAX_RESULTS = 5;

const UsageSchema = z.object({ credits: z.number() }).nullish();
const SearchResponseSchema = z.object({
  results: z.array(
    z.object({
      url: z.string(),
      title: z.string().nullish(),
      content: z.string().nullish(),
      score: z.number().nullish(),
    }),
  ),
  usage: UsageSchema,
});
const ExtractResponseSchema = z.object({
  results: z.array(
    z.object({
      url: z.string(),
      title: z.string().nullish(),
      rawContent: z.string().nullish(),
    }),
  ),
  failedResults: z
    .array(z.object({ url: z.string(), error: z.string() }))
    .nullish(),
  usage: UsageSchema,
});

/** Web search; hits have normalised URLs, duplicates removed, and keep Tavily's relevance order. */
export function searchWeb(
  query: string,
  options: SearchOptions,
): Promise<SearchResult> {
  return request(
    "search",
    options,
    (timeout) =>
      getTavilyClient().search(query, {
        searchDepth: "basic",
        maxResults: options.maxResults ?? DEFAULT_MAX_RESULTS,
        includeAnswer: false,
        includeRawContent: false,
        includeUsage: true,
        timeout,
        ...(options.includeDomains?.length
          ? { includeDomains: options.includeDomains }
          : {}),
      }),
    (raw) => {
      const parsed = parseOrThrow("search", SearchResponseSchema, raw);
      const seen = new Set<string>();
      const hits: SearchHit[] = [];
      for (const item of parsed.results) {
        const url = cleanUrl(item.url);
        if (url === null || seen.has(url)) continue;
        seen.add(url);
        hits.push({
          url,
          title: item.title ?? "",
          snippet: item.content ?? "",
          score: item.score ?? 0,
        });
      }
      return { hits, credits: parsed.usage?.credits ?? null };
    },
  );
}

/** Fetches page text for up to 10 URLs in one request; pages with no text are reported as failed. */
export async function extractPages(
  urls: string[],
  options: CallOptions,
): Promise<ExtractResult> {
  const unique = [
    ...new Set(urls.map(cleanUrl).filter((url): url is string => url !== null)),
  ];
  if (unique.length > MAX_EXTRACT_URLS) {
    throw new RangeError(
      `Too many URLs to extract at once: ${unique.length} (max ${MAX_EXTRACT_URLS})`,
    );
  }
  if (unique.length === 0) {
    return { pages: [], failed: [], credits: null };
  }
  return request(
    "extract",
    options,
    (timeout) =>
      getTavilyClient().extract(unique, {
        extractDepth: "basic",
        format: "markdown",
        includeImages: false,
        includeUsage: true,
        timeout,
      }),
    (raw) => {
      const parsed = parseOrThrow("extract", ExtractResponseSchema, raw);
      const pages: ExtractedPage[] = [];
      const failed = [...(parsed.failedResults ?? [])];
      for (const item of parsed.results) {
        const url = cleanUrl(item.url) ?? item.url;
        const text = rewriteLinks(item.rawContent ?? "");
        if (text.trim() === "") {
          failed.push({ url, error: "No text content" });
        } else {
          pages.push({ url, title: item.title ?? null, text });
        }
      }
      return { pages, failed, credits: parsed.usage?.credits ?? null };
    },
  );
}
