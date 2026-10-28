/**
 * File: search-summary.test.ts
 * Purpose: Tests the search summary log line: queries run and failed, and the results by source tier.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { searchWeb } from "../../lib/tavily.js";
import { createHarness } from "../../test-support/graph-harness.js";
import { ok, state } from "../../test-support/search-helpers.js";
import { searchNode } from "./search.js";

vi.mock("../../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
const tavily = vi.mocked(searchWeb);
const info = vi.spyOn(logger, "info");
const warn = vi.spyOn(logger, "warn");

beforeEach(() => {
  tavily.mockReset();
  info.mockReset().mockImplementation(() => {});
  warn.mockReset().mockImplementation(() => {});
});

const summary = () =>
  info.mock.calls.find(([m]) => m === "search summary")?.[1] as Record<
    string,
    unknown
  >;

describe("the search summary line", () => {
  it("counts the queries, the failed ones and the results by tier", async () => {
    tavily.mockResolvedValueOnce(
      ok(
        "https://docs.acme.com/a",
        "https://blog.example.net/b",
        "https://community.acme.com/c",
      ),
    );
    tavily.mockRejectedValueOnce(new Error("429"));
    tavily.mockResolvedValue(ok("https://docs.acme.com/a"));
    await searchNode(state(), createHarness().config);
    expect(summary()).toEqual({
      runId: "run_1",
      retryPass: false,
      queries: 8,
      failedQueries: 1,
      results: 3,
      byTier: { official: 1, third_party: 1, forum: 1 },
    });
  });

  it("marks the retry pass", async () => {
    tavily.mockResolvedValue(ok("https://docs.acme.com/a"));
    await searchNode(
      state({ missingSections: ["steps"] }),
      createHarness().config,
    );
    expect(summary()).toMatchObject({
      retryPass: true,
      queries: 1,
      failedQueries: 0,
    });
  });

  it("logs no page text or URLs", async () => {
    tavily.mockResolvedValue(ok("https://docs.acme.com/secret-path"));
    await searchNode(state(), createHarness().config);
    expect(JSON.stringify(summary())).not.toContain("secret-path");
  });
});
