/**
 * File: fetch-helpers.ts
 * Purpose: Shared builders and mock defaults for the fetch node tests: search results, state, extract replies and page lists.
 * Exports: o, t, reviewed, officials, state, extracted, fetchedUrls, pagesOf, resetFetchMocks
 * Used by: agent/nodes/fetch*.test.ts
 */
import type { Mock } from "vitest";
import { createHarness, makeState } from "./graph-harness.js";
import { APP, LONG_TEXT, pageRecord, result } from "./node-fixtures.js";

/** Official search result n, scored so lower numbers rank higher. */
export const o = (n: number) =>
  result(`https://docs.acme.com/o${n}`, "official", 1 - n / 100);
export const t = (n: number) =>
  result(`https://blog.example.net/t${n}`, "third_party");
/** A third-party result whose title answers a topic, so it can take the reserved non-official slot. */
export const reviewed = (n: number) => ({
  ...t(n),
  title: "OAuth app review times",
  topics: ["approvalWait"],
});
export const officials = (n: number) =>
  Array.from({ length: n }, (_, i) => o(i + 1));

export const state = (extra: Partial<Parameters<typeof makeState>[0]> = {}) =>
  makeState({ app: APP, ...extra });

/** What Tavily's extract returns for these URLs, each with the same text. */
export const extracted = (urls: string[], text = LONG_TEXT) => ({
  pages: urls.map((url) => ({ url, title: null, text })),
  failed: [],
  credits: 1,
});

export const fetchedUrls = (h: ReturnType<typeof createHarness>) =>
  h.events.flatMap((e) => (e.type === "page.fetched" ? [e.url] : []));

export const pagesOf = (update: { pages?: unknown }) =>
  (update.pages ?? []) as { url: string; tier: string }[];

/** Default behaviour: extract returns every URL, the cache misses, a store returns the page it was given. */
export function resetFetchMocks(mocks: {
  extract: Mock;
  cached: Mock;
  store: Mock;
}): void {
  mocks.extract
    .mockReset()
    .mockImplementation((urls: string[]) => Promise.resolve(extracted(urls)));
  mocks.cached.mockReset().mockResolvedValue(null);
  mocks.store
    .mockReset()
    .mockImplementation(
      ({ url, tier, text }: { url: string; tier: never; text: string }) =>
        Promise.resolve(pageRecord(url, tier, text)),
    );
}
