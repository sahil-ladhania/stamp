/**
 * File: search.test.ts
 * Purpose: Tests the search stage's first pass with a mocked Tavily: the searches made, events, tiering and ordering.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { searchWeb } from "../../lib/tavily.js";
import { createHarness } from "../../test-support/graph-harness.js";
import { hit } from "../../test-support/node-fixtures.js";
import { ok, state, urlsOf } from "../../test-support/search-helpers.js";
import {
  SEARCH_CONCURRENCY,
  SEARCH_MAX_RESULTS,
  searchNode,
} from "./search.js";

vi.mock("../../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
vi.spyOn(logger, "info").mockImplementation(() => {});
const tavily = vi.mocked(searchWeb);

beforeEach(() => {
  tavily.mockReset();
});

describe("searchNode first pass", () => {
  it("emits each query once, then searches: 6 on the official domain and 2 open", async () => {
    const h = createHarness();
    tavily.mockResolvedValue(ok());
    await searchNode(state(), h.config);
    const queries = h.events.filter((e) => e.type === "search.query");
    expect(queries).toHaveLength(6);
    expect(tavily).toHaveBeenCalledTimes(8);
    const restricted = tavily.mock.calls.filter(
      ([, o]) => o.includeDomains?.length,
    );
    expect(restricted).toHaveLength(6);
    expect(
      restricted.every(([, o]) => o.includeDomains?.join() === "acme.com"),
    ).toBe(true);
  });

  it("emits all the queries before any search runs", async () => {
    const h = createHarness();
    tavily.mockImplementation(() => {
      expect(h.events.filter((e) => e.type === "search.query")).toHaveLength(6);
      return Promise.resolve(ok());
    });
    await searchNode(state(), h.config);
  });

  it("passes the result cap, the run's meter and signal, and the search time window", async () => {
    const h = createHarness();
    tavily.mockResolvedValue(ok());
    await searchNode(state(), h.config);
    expect(tavily.mock.calls[0]?.[1]).toMatchObject({
      maxResults: SEARCH_MAX_RESULTS,
      timeoutMs: 8_000,
      usage: h.deps.usage,
      runId: "run_1",
      signal: h.controller.signal,
    });
  });

  it("returns results tiered against the official domain, official first, without repeats", async () => {
    const h = createHarness();
    tavily.mockImplementation(async (_query, options) =>
      options.includeDomains?.length
        ? ok("https://docs.acme.com/oauth", "https://docs.acme.com/scopes")
        : ok(
            "https://blog.example.net/acme",
            "https://community.acme.com/t/1",
            "https://docs.acme.com/oauth",
          ),
    );
    const update = await searchNode(state(), h.config);
    expect(urlsOf(update)).toEqual([
      "https://docs.acme.com/oauth",
      "https://docs.acme.com/scopes",
      "https://blog.example.net/acme",
      "https://community.acme.com/t/1",
    ]);
    expect(
      (update.searchResults as { tier: string }[]).map((r) => r.tier),
    ).toEqual(["official", "official", "third_party", "forum"]);
  });

  it("orders results within a tier by Tavily's score, best first", async () => {
    const h = createHarness();
    tavily.mockImplementation(async (_query, options) => ({
      hits: options.includeDomains?.length
        ? [
            hit("https://docs.acme.com/low", 0.1),
            hit("https://docs.acme.com/high", 0.9),
          ]
        : [],
      credits: 1,
    }));
    const update = await searchNode(state(), h.config);
    expect(urlsOf(update)).toEqual([
      "https://docs.acme.com/high",
      "https://docs.acme.com/low",
    ]);
  });

  it("uses the default queries when the plan left none", async () => {
    const h = createHarness();
    tavily.mockResolvedValue(ok());
    await searchNode(state({ queries: [] }), h.config);
    expect(tavily).toHaveBeenCalledTimes(8);
  });

  it("never runs more searches at once than the limit", async () => {
    const h = createHarness();
    let running = 0;
    let peak = 0;
    tavily.mockImplementation(async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return ok();
    });
    await searchNode(state(), h.config);
    expect(peak).toBe(SEARCH_CONCURRENCY);
  });
});
