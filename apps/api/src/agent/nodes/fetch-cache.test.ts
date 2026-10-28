/**
 * File: fetch-cache.test.ts
 * Purpose: Tests the fetch stage's page cache use with a mocked Tavily and cache: hits, misses, tiers and failed reads and writes.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { extractPages } from "../../lib/tavily.js";
import { getCachedPage, storePage } from "../../services/page-cache.js";
import { createHarness } from "../../test-support/graph-harness.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import {
  fetchedUrls,
  o,
  pagesOf,
  resetFetchMocks,
  state,
  t,
} from "../../test-support/fetch-helpers.js";
import { fetchNode } from "./fetch.js";

vi.mock("../../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
vi.mock("../../services/page-cache.js", () => ({
  getCachedPage: vi.fn(),
  storePage: vi.fn(),
}));
const extract = vi.mocked(extractPages);
const cached = vi.mocked(getCachedPage);
const store = vi.mocked(storePage);
const warn = vi.spyOn(logger, "warn");

beforeEach(() => {
  resetFetchMocks({ extract, cached, store });
  warn.mockReset().mockImplementation(() => {});
});

describe("fetchNode page cache", () => {
  it("serves a cached page without extracting it, and still emits page.fetched", async () => {
    const h = createHarness();
    cached.mockImplementation(async (url) =>
      url.endsWith("/o1") ? pageRecord(url) : null,
    );
    const update = await fetchNode(
      state({ searchResults: [o(1), o(2)] }),
      h.config,
    );
    expect(extract.mock.calls[0]?.[0]).toEqual(["https://docs.acme.com/o2"]);
    expect(fetchedUrls(h)).toEqual([
      "https://docs.acme.com/o1",
      "https://docs.acme.com/o2",
    ]);
    expect(pagesOf(update)).toHaveLength(2);
    expect(store).toHaveBeenCalledTimes(1);
  });

  it("does not call Tavily when every page is cached", async () => {
    const h = createHarness();
    cached.mockImplementation(async (url) => pageRecord(url));
    await fetchNode(state({ searchResults: [o(1), o(2)] }), h.config);
    expect(extract).not.toHaveBeenCalled();
    expect(h.deps.usage.pages).toEqual({ fetched: 0, cacheHits: 2 });
  });

  it("counts fetched pages and cache hits in the run's meter", async () => {
    const h = createHarness();
    cached.mockImplementation(async (url) =>
      url.endsWith("/o1") ? pageRecord(url) : null,
    );
    await fetchNode(state({ searchResults: [o(1), o(2), o(3)] }), h.config);
    expect(h.deps.usage.pages).toEqual({ fetched: 2, cacheHits: 1 });
  });

  it("decides a cached page's tier against this app, not the app it was cached for", async () => {
    const h = createHarness();
    cached.mockImplementation(async (url) => pageRecord(url, "official"));
    const update = await fetchNode(
      state({ searchResults: [o(1), t(1)] }),
      h.config,
    );
    expect(pagesOf(update).map((p) => p.tier)).toEqual([
      "official",
      "third_party",
    ]);
    expect(
      h.events
        .filter((e) => e.type === "page.fetched")
        .map((e) => ("tier" in e ? e.tier : "")),
    ).toEqual(["official", "third_party"]);
  });

  it("treats a failed cache read as a miss", async () => {
    const h = createHarness();
    cached.mockRejectedValue(new Error("db down"));
    const update = await fetchNode(state({ searchResults: [o(1)] }), h.config);
    expect(extract).toHaveBeenCalledTimes(1);
    expect(pagesOf(update)).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith("page cache read failed", {
      runId: "run_1",
      detail: "Error: db down",
    });
  });

  it("drops a page whose cache write fails and keeps the others", async () => {
    const h = createHarness();
    store.mockImplementation(async ({ url, tier, text }) => {
      if (url.endsWith("/o2")) throw new Error("db down");
      return pageRecord(url, tier, text);
    });
    const update = await fetchNode(
      state({ searchResults: [o(1), o(2), o(3)] }),
      h.config,
    );
    expect(pagesOf(update).map((p) => p.url)).toEqual([
      "https://docs.acme.com/o1",
      "https://docs.acme.com/o3",
    ]);
  });
});
