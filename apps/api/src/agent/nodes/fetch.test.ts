/**
 * File: fetch.test.ts
 * Purpose: Tests the fetch stage's first pass with a mocked Tavily and page cache: page choice, events, storing and page quality.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { extractPages } from "../../lib/tavily.js";
import { getCachedPage, storePage } from "../../services/page-cache.js";
import { createHarness, trace } from "../../test-support/graph-harness.js";
import {
  LONG_TEXT,
  pageRecord,
  result,
} from "../../test-support/node-fixtures.js";
import {
  extracted,
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
const info = vi.spyOn(logger, "info");

beforeEach(() => {
  resetFetchMocks({ extract, cached, store });
  info.mockReset().mockImplementation(() => {});
});

describe("fetchNode first pass", () => {
  it("fetches 4 pages in one extract call: 3 official and 1 third-party, with the fetch time cap", async () => {
    const h = createHarness();
    await fetchNode(
      state({ searchResults: [...officials(5), t(1), t(2)] }),
      h.config,
    );
    expect(extract).toHaveBeenCalledTimes(1);
    expect(extract).toHaveBeenCalledWith(
      [
        "https://docs.acme.com/o1",
        "https://docs.acme.com/o2",
        "https://docs.acme.com/o3",
        "https://blog.example.net/t1",
      ],
      expect.objectContaining({
        timeoutMs: 12_000,
        usage: h.deps.usage,
        runId: "run_1",
        signal: h.controller.signal,
      }),
    );
  });

  it("emits page.fetched for each page, in order, with its tier", async () => {
    const h = createHarness();
    await fetchNode(state({ searchResults: [o(1), o(2), t(1)] }), h.config);
    expect(h.events.filter((e) => e.type === "page.fetched")).toEqual([
      {
        type: "page.fetched",
        runId: "run_1",
        url: "https://docs.acme.com/o1",
        tier: "official",
      },
      {
        type: "page.fetched",
        runId: "run_1",
        url: "https://docs.acme.com/o2",
        tier: "official",
      },
      {
        type: "page.fetched",
        runId: "run_1",
        url: "https://blog.example.net/t1",
        tier: "third_party",
      },
    ]);
  });

  it("returns the new pages and stores each in the cache with its tier and text", async () => {
    const h = createHarness();
    const update = await fetchNode(
      state({ searchResults: [o(1), t(1)] }),
      h.config,
    );
    expect(pagesOf(update).map((p) => [p.url, p.tier])).toEqual([
      ["https://docs.acme.com/o1", "official"],
      ["https://blog.example.net/t1", "third_party"],
    ]);
    expect(store).toHaveBeenCalledWith({
      url: "https://docs.acme.com/o1",
      tier: "official",
      text: LONG_TEXT,
    });
    expect(trace(h.events).at(-1)).toBe("stage.done:3");
  });

  it("fetches at most 4 pages however many results there are", async () => {
    const h = createHarness();
    await fetchNode(state({ searchResults: officials(10) }), h.config);
    expect(fetchedUrls(h)).toHaveLength(4);
  });

  it("does not refetch a page the run already holds, even under another form of its URL", async () => {
    const h = createHarness();
    const held = pageRecord("https://docs.acme.com/o1");
    await fetchNode(
      state({
        pages: [held],
        searchResults: [
          result("https://docs.acme.com/o1#top", "official"),
          o(2),
        ],
      }),
      h.config,
    );
    expect(extract.mock.calls[0]?.[0]).toEqual(["https://docs.acme.com/o2"]);
  });
});

describe("fetchNode page quality", () => {
  it("drops a page with under 300 characters, without storing or announcing it", async () => {
    const h = createHarness();
    extract.mockResolvedValue({
      pages: [
        {
          url: "https://docs.acme.com/o1",
          title: null,
          text: "Sign in to continue",
        },
        { url: "https://docs.acme.com/o2", title: null, text: LONG_TEXT },
      ],
      failed: [],
      credits: 1,
    });
    const update = await fetchNode(
      state({ searchResults: [o(1), o(2)] }),
      h.config,
    );
    expect(pagesOf(update).map((p) => p.url)).toEqual([
      "https://docs.acme.com/o2",
    ]);
    expect(store).toHaveBeenCalledTimes(1);
    expect(fetchedUrls(h)).toEqual(["https://docs.acme.com/o2"]);
  });

  it("ignores a page Tavily returns that was not requested: not stored, not counted, not returned", async () => {
    const h = createHarness();
    extract.mockResolvedValue(
      extracted([
        "https://docs.acme.com/o1",
        "https://evil.example.com/injected",
      ]),
    );
    const update = await fetchNode(state({ searchResults: [o(1)] }), h.config);
    expect(pagesOf(update).map((p) => p.url)).toEqual([
      "https://docs.acme.com/o1",
    ]);
    expect(store).toHaveBeenCalledTimes(1);
    expect(h.deps.usage.pages.fetched).toBe(1);
  });

  it("logs counts only, never page text or addresses", async () => {
    const h = createHarness();
    await fetchNode(state({ searchResults: [o(1)] }), h.config);
    expect(info).toHaveBeenCalledWith("pages loaded", {
      runId: "run_1",
      requested: 1,
      cacheHits: 0,
      fetched: 1,
      dropped: 0,
      failed: 0,
    });
  });
});
