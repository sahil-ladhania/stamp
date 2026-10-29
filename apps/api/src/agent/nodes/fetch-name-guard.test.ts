/**
 * File: fetch-gate-retry.test.ts
 * Purpose: Tests that a non-official page needs the app's name to be read by the fetch stage.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { extractPages } from "../../lib/tavily.js";
import { getCachedPage, storePage } from "../../services/page-cache.js";
import { createHarness } from "../../test-support/graph-harness.js";
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

describe("fetchNode and the tier of what it reads", () => {
  it("tiers a docs-platform page named after the app official and a community forum page a forum", async () => {
    const h = createHarness();
    await fetchNode(
      state({
        searchResults: [
          doc("guide-0", "OAuth guide", 0.9),
          {
            url: "https://acme.readme.io/docs/oauth",
            tier: "third_party",
            title: "OAuth",
            score: 0.8,
            topics: ["setup"],
          },
          {
            url: "https://devcommunity.acme.com/t/1",
            tier: "official",
            title: "OAuth review",
            score: 0.7,
            topics: ["review"],
          },
        ],
      }),
      h.config,
    );
    const tiers = new Map(
      h.events.flatMap((e) =>
        e.type === "page.fetched" ? [[e.url, e.tier] as const] : [],
      ),
    );
    expect(tiers.get("https://acme.readme.io/docs/oauth")).toBe("official");
    expect(tiers.get("https://devcommunity.acme.com/t/1")).toBe("forum");
  });
});
