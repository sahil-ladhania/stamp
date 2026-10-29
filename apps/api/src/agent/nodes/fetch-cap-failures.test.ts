/**
 * File: fetch-cap-failures.test.ts
 * Purpose: Tests the fetch stage's 6-page cap, retry pass and failure codes with a mocked Tavily and page cache.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractPages } from "../../lib/tavily.js";
import { getCachedPage, storePage } from "../../services/page-cache.js";
import {
  createHarness,
  makeState,
  trace,
} from "../../test-support/graph-harness.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import {
  fetchedUrls,
  o,
  officials,
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

beforeEach(() => {
  resetFetchMocks({ extract, cached, store });
});

describe("fetchNode 8-page cap and retry", () => {
  const held = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      pageRecord(`https://docs.acme.com/held${i}`),
    );

  it("fetches only 4 more when 4 pages are held, on the retry pass", async () => {
    const h = createHarness();
    await fetchNode(
      state({ pages: held(4), retryCount: 1, searchResults: officials(8) }),
      h.config,
    );
    expect(extract.mock.calls[0]?.[0]).toHaveLength(4);
    expect(extract.mock.calls[0]?.[1].timeoutMs).toBe(8_000);
  });

  it("fetches nothing more once 8 pages are held, and does not fail", async () => {
    const h = createHarness();
    const update = await fetchNode(
      state({ pages: held(8), retryCount: 1, searchResults: officials(10) }),
      h.config,
    );
    expect(extract).not.toHaveBeenCalled();
    expect(update.failure).toBeUndefined();
    expect(pagesOf(update)).toEqual([]);
  });

  it("counts cache hits toward the 8", async () => {
    const h = createHarness();
    cached.mockImplementation(async (url) => pageRecord(url));
    await fetchNode(state({ searchResults: officials(10) }), h.config);
    expect(fetchedUrls(h)).toHaveLength(4);
    expect(h.deps.usage.pages.cacheHits).toBe(4);
  });

  it("does not fail the retry pass when it finds nothing new but an official page is already held", async () => {
    const h = createHarness();
    const update = await fetchNode(
      state({ pages: held(2), retryCount: 1, searchResults: [] }),
      h.config,
    );
    expect(update.failure).toBeUndefined();
  });
});

describe("fetchNode failures", () => {
  it("ends the run with NO_PUBLIC_DOCS when no official page was fetched, and shows the others it found", async () => {
    const h = createHarness();
    const update = await fetchNode(
      state({ searchResults: [t(1), t(2)] }),
      h.config,
    );
    expect(update.failure).toMatchObject({ stage: 3, code: "NO_PUBLIC_DOCS" });
    expect(pagesOf(update)).toHaveLength(2);
    expect(trace(h.events)).not.toContain("stage.done:3");
  });

  it("ends the run with NO_PUBLIC_DOCS when the search found no pages at all", async () => {
    const h = createHarness();
    const update = await fetchNode(state({ searchResults: [] }), h.config);
    expect(update.failure).toMatchObject({ code: "NO_PUBLIC_DOCS" });
    expect(extract).not.toHaveBeenCalled();
  });

  it("ends the run with INTERNAL, not NO_PUBLIC_DOCS, when extract failed and nothing is held", async () => {
    const h = createHarness();
    extract.mockRejectedValue(new Error("Tavily extract failed (status 500)"));
    const update = await fetchNode(state({ searchResults: [o(1)] }), h.config);
    expect(update.failure).toMatchObject({ stage: 3, code: "INTERNAL" });
  });

  it("carries on with a cached official page when extract fails", async () => {
    const h = createHarness();
    extract.mockRejectedValue(new Error("Tavily extract failed (status 500)"));
    cached.mockImplementation(async (url) =>
      url.endsWith("/o1") ? pageRecord(url) : null,
    );
    const update = await fetchNode(
      state({ searchResults: [o(1), o(2)] }),
      h.config,
    );
    expect(update.failure).toBeUndefined();
    expect(pagesOf(update)).toHaveLength(1);
  });

  it("lets an abort through", async () => {
    const h = createHarness();
    extract.mockImplementation(() => {
      h.controller.abort();
      return Promise.reject(new Error("aborted"));
    });
    await expect(
      fetchNode(state({ searchResults: [o(1)] }), h.config),
    ).rejects.toBeDefined();
  });

  it("fails with INTERNAL if resolve left no app", async () => {
    const h = createHarness();
    expect((await fetchNode(makeState(), h.config)).failure).toMatchObject({
      stage: 3,
      code: "INTERNAL",
    });
  });
});
