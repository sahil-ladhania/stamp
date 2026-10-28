/**
 * File: search-failures.test.ts
 * Purpose: Tests the search stage's failures, time window and retry pass with a mocked Tavily.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { searchWeb } from "../../lib/tavily.js";
import {
  createHarness,
  makeState,
  trace,
} from "../../test-support/graph-harness.js";
import { ok, state, urlsOf } from "../../test-support/search-helpers.js";
import { SEARCH_CONCURRENCY, searchNode } from "./search.js";

vi.mock("../../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
const tavily = vi.mocked(searchWeb);
const warn = vi.spyOn(logger, "warn");

beforeEach(() => {
  tavily.mockReset();
  warn.mockReset().mockImplementation(() => {});
});

describe("searchNode failures and time", () => {
  it("keeps the results of the searches that worked when some fail", async () => {
    const h = createHarness();
    tavily.mockImplementation(async (query) => {
      if (query.includes("scopes"))
        throw new Error("Tavily search failed (status 500)");
      return ok(`https://docs.acme.com/${encodeURIComponent(query)}`);
    });
    const update = await searchNode(state(), h.config);
    expect(update.failure).toBeUndefined();
    // Six distinct queries minus the failed one; the open searches repeat two of the official queries' URLs.
    expect(urlsOf(update)).toHaveLength(5);
    expect(warn).toHaveBeenCalled();
  });

  it("ends the run with INTERNAL when every search fails", async () => {
    const h = createHarness();
    tavily.mockRejectedValue(new Error("Tavily search failed (status 401)"));
    const update = await searchNode(state(), h.config);
    expect(update.failure).toMatchObject({ stage: 2, code: "INTERNAL" });
    expect(trace(h.events).at(-1)).not.toBe("stage.done:2");
  });

  it("does not fail when the searches work but find nothing: fetch decides that", async () => {
    const h = createHarness();
    tavily.mockResolvedValue(ok());
    const update = await searchNode(state(), h.config);
    expect(update.failure).toBeUndefined();
    expect(update.searchResults).toEqual([]);
  });

  it("skips searches that cannot start with time left in the node's window", async () => {
    const h = createHarness();
    tavily.mockImplementation(async () => {
      // Let the first four searches start together, then use up most of the node's 8 s window.
      await Promise.resolve();
      h.advance(7_000);
      return ok();
    });
    const update = await searchNode(state(), h.config);
    expect(tavily).toHaveBeenCalledTimes(SEARCH_CONCURRENCY);
    expect(update.failure).toBeUndefined();
  });

  it("lets an abort through", async () => {
    const h = createHarness();
    tavily.mockImplementation(() => {
      h.controller.abort();
      return Promise.reject(new Error("aborted"));
    });
    await expect(searchNode(state(), h.config)).rejects.toBeDefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it("fails with INTERNAL if resolve left no app", async () => {
    const h = createHarness();
    expect((await searchNode(makeState(), h.config)).failure).toMatchObject({
      stage: 2,
      code: "INTERNAL",
    });
    expect(tavily).not.toHaveBeenCalled();
  });
});

describe("searchNode retry pass", () => {
  it("runs only targeted searches on the official domain, within the smaller time cap", async () => {
    const h = createHarness();
    tavily.mockResolvedValue(ok("https://docs.acme.com/steps"));
    await searchNode(state({ missingSections: ["steps", "scopes"] }), h.config);
    expect(tavily).toHaveBeenCalledTimes(2);
    expect(
      tavily.mock.calls.every(
        ([, o]) => o.includeDomains?.join() === "acme.com",
      ),
    ).toBe(true);
    expect(tavily.mock.calls[0]?.[1].timeoutMs).toBe(6_000);
    expect(h.events.filter((e) => e.type === "search.query")).toHaveLength(2);
  });
});
