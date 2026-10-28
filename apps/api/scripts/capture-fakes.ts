/**
 * File: capture-fakes.ts
 * Purpose: Fake Tavily functions and an in-memory writer for testing the fixture capture without keys or files.
 * Exports: makeDeps, fakeHits
 * Used by: scripts/capture-run.test.ts, scripts/capture-run-failures.test.ts
 */
import type { SearchResult } from "../src/lib/tavily.js";
import type { CaptureDeps } from "./capture-run.js";

/** Official-looking hits for a restricted search, and a blog plus a forum hit for an open one. */
export function fakeHits(
  query: string,
  includeDomains: string[],
): SearchResult {
  const path = encodeURIComponent(query.toLowerCase().replaceAll(" ", "-"));
  const hits =
    includeDomains.length > 0
      ? [1, 2, 3].map((n) => ({
          url: `https://developers.${includeDomains[0]}/docs/${path}-${n}`,
          title: `Doc ${n}`,
          snippet: "text",
          score: 1 - n / 10,
        }))
      : [
          {
            url: `https://blog.example.net/${path}`,
            title: "Blog",
            snippet: "text",
            score: 0.9,
          },
          {
            url: `https://stackoverflow.com/q/${path}`,
            title: "Q&A",
            snippet: "text",
            score: 0.8,
          },
        ];
  return { hits, credits: 1 };
}

export function makeDeps(overrides: Partial<CaptureDeps> = {}) {
  const written = new Map<string, unknown>();
  const logs: string[] = [];
  const searches: {
    query: string;
    includeDomains: string[];
    maxResults: number;
  }[] = [];
  const extracts: string[][] = [];
  const deps: CaptureDeps = {
    search: (query, options) => {
      searches.push({ query, ...options });
      return Promise.resolve(fakeHits(query, options.includeDomains));
    },
    extract: (urls) => {
      extracts.push(urls);
      return Promise.resolve({
        pages: urls.map((url) => ({
          url,
          title: "Title",
          text: "page text ".repeat(20),
        })),
        failed: [],
        credits: 1,
      });
    },
    write: (file, data) => {
      written.set(file, data);
      return Promise.resolve(JSON.stringify(data).length);
    },
    log: (line) => {
      logs.push(line);
    },
    now: () => new Date("2026-03-05T10:00:00.000Z"),
    ...overrides,
  };
  return { deps, written, logs, searches, extracts };
}
