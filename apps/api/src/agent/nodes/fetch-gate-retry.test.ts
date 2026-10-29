/**
 * File: fetch-gate-retry.test.ts
 * Purpose: Tests the fetch stage's retry pass when the review gate is unknown (gate pages first), and that a non-official page needs the app's name to be read.
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
  resetFetchMocks,
  state,
} from "../../test-support/fetch-helpers.js";
import type { SearchResult } from "../search-result.js";
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
vi.spyOn(logger, "info").mockImplementation(() => {});

beforeEach(() => resetFetchMocks({ extract, cached, store }));

const doc = (path: string, title: string, score: number): SearchResult => ({
  url: `https://docs.acme.com/${path}`,
  tier: "official",
  title,
  score,
  topics: ["setup"],
});
const generic = Array.from({ length: 6 }, (_, i) =>
  doc(`guide-${i}`, `OAuth guide ${i}`, 0.9 - i / 100),
);
const listing = doc(
  "marketplace-listing",
  "List your app on the marketplace",
  0.2,
);

describe("fetchNode on a retry with an unknown review gate", () => {
  // Seven pages already held leave room for one more: the choice between a good generic page and gate documentation.
  const held = Array.from({ length: 7 }, (_, i) =>
    pageRecord(`https://docs.acme.com/held-${i}`),
  );
  const retry = (missingSections: string[]) =>
    state({
      pages: held,
      retryCount: 1,
      missingSections,
      searchResults: [generic[0] as SearchResult, listing],
    });

  it("reads the gate documentation before a better-scored generic page", async () => {
    const h = createHarness();
    await fetchNode(retry(["reviewGate"]), h.config);
    expect(fetchedUrls(h)).toEqual([
      "https://docs.acme.com/marketplace-listing",
    ]);
  });

  it("does not, when the gate is known and only steps are missing", async () => {
    const h = createHarness();
    await fetchNode(retry(["steps"]), h.config);
    expect(fetchedUrls(h)).toEqual(["https://docs.acme.com/guide-0"]);
  });
});

describe("fetchNode and the reserved non-official slot", () => {
  const forum = (title: string): SearchResult => ({
    url: "https://forum.example.org/t/1",
    tier: "forum",
    title,
    score: 0.4,
    topics: ["approvalWait"],
  });

  it("skips a forum post about another company's app review", async () => {
    const h = createHarness();
    await fetchNode(
      state({ searchResults: [...generic, forum("OAuth app review time")] }),
      h.config,
    );
    expect(fetchedUrls(h)).not.toContain("https://forum.example.org/t/1");
  });

  it("reads one that names the app", async () => {
    const h = createHarness();
    await fetchNode(
      state({
        searchResults: [...generic, forum("Acme OAuth app review time")],
      }),
      h.config,
    );
    expect(fetchedUrls(h)).toContain("https://forum.example.org/t/1");
  });
});
