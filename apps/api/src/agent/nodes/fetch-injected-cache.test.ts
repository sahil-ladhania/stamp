/**
 * File: fetch-injected-cache.test.ts
 * Purpose: Tests that a page cache passed through the run's deps replaces the database cache in the fetch stage.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractPages } from "../../lib/tavily.js";
import { getCachedPage, storePage } from "../../services/page-cache.js";
import { createHarness } from "../../test-support/graph-harness.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import {
  o,
  pagesOf,
  resetFetchMocks,
  state,
} from "../../test-support/fetch-helpers.js";
import type { PageCachePort } from "../page-record.js";
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
const dbGet = vi.mocked(getCachedPage);
const dbStore = vi.mocked(storePage);

beforeEach(() => {
  resetFetchMocks({ extract, cached: dbGet, store: dbStore });
});

function neverRemembers(): PageCachePort {
  return {
    get: vi.fn().mockResolvedValue(null),
    store: vi.fn(({ url, tier, text }) =>
      Promise.resolve(pageRecord(url, tier, text)),
    ),
  };
}

describe("fetchNode with an injected page cache", () => {
  it("reads and writes the injected cache and never touches the database cache", async () => {
    const h = createHarness();
    h.deps.pageCache = neverRemembers();
    const update = await fetchNode(
      state({ searchResults: [o(1), o(2)] }),
      h.config,
    );
    expect(pagesOf(update)).toHaveLength(2);
    expect(h.deps.pageCache.get).toHaveBeenCalledTimes(2);
    expect(h.deps.pageCache.store).toHaveBeenCalledTimes(2);
    expect(dbGet).not.toHaveBeenCalled();
    expect(dbStore).not.toHaveBeenCalled();
  });

  it("fetches every page from Tavily when the injected cache always misses", async () => {
    const h = createHarness();
    h.deps.pageCache = neverRemembers();
    await fetchNode(state({ searchResults: [o(1)] }), h.config);
    expect(extract.mock.calls[0]?.[0]).toEqual(["https://docs.acme.com/o1"]);
  });

  it("uses the database cache when no cache is injected", async () => {
    const h = createHarness();
    await fetchNode(state({ searchResults: [o(1)] }), h.config);
    expect(dbGet).toHaveBeenCalledTimes(1);
    expect(dbStore).toHaveBeenCalledTimes(1);
  });
});
