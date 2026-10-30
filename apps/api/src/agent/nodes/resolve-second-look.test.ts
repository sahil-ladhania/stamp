/**
 * File: resolve-second-look.test.ts
 * Purpose: Tests the resolve stage's extra search: a retry after a failed search, and one second look when the first answer is thin, each with a short time limit and each reported once.
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
import { hit } from "../../test-support/node-fixtures.js";
import { resolveNode } from "./resolve.js";

vi.mock("../../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
const search = vi.mocked(searchWeb);
const info = vi.spyOn(logger, "info");
const error = vi.spyOn(logger, "error");

const answer = (...urls: string[]) => ({
  hits: urls.map((url) => hit(url)),
  credits: 1,
});

beforeEach(() => {
  search.mockReset();
  info.mockReset().mockImplementation(() => {});
  error.mockReset().mockImplementation(() => {});
});

describe("resolveNode second look", () => {
  it("looks a second time when the first search decided nothing, and uses both lists", async () => {
    const h = createHarness();
    search
      .mockResolvedValueOnce(answer("https://example.org/page"))
      .mockResolvedValueOnce(answer("https://developers.notion.com/docs"));
    const update = await resolveNode(
      makeState({ typed: "Notion", slug: "notion" }),
      h.config,
    );
    expect(update.app).toMatchObject({ domain: "notion.com" });
    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1]?.[0]).toBe("Notion developer portal");
    expect(trace(h.events)).toEqual([
      "stage.started:0",
      "search.query",
      "search.query",
      "app.resolved",
      "stage.done:0",
    ]);
  });

  it("gives the second look at most 3 seconds, and the first search the whole resolve cap", async () => {
    const h = createHarness();
    search.mockResolvedValue(answer("https://example.org/page"));
    await resolveNode(makeState({ typed: "Notion" }), h.config);
    expect(search.mock.calls[0]?.[1]).toMatchObject({ timeoutMs: 6_000 });
    expect(search.mock.calls[1]?.[1]).toMatchObject({ timeoutMs: 3_000 });
  });

  it("makes no second search when the first answer is clear", async () => {
    const h = createHarness();
    search.mockResolvedValue(answer("https://developers.notion.com/docs"));
    await resolveNode(makeState({ typed: "Notion" }), h.config);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("logs the queries and whether it looked again, without page text", async () => {
    const h = createHarness();
    search.mockResolvedValue(answer("https://example.org/page"));
    await resolveNode(makeState({ typed: "Notion" }), h.config);
    const summary = info.mock.calls.find(
      (call) => call[0] === "resolve summary",
    )?.[1];
    expect(summary).toMatchObject({
      decision: "none",
      lookedAgain: true,
      retried: false,
      queries: [
        "Notion API developer documentation",
        "Notion developer portal",
      ],
    });
  });
});

describe("resolveNode retry", () => {
  it("tries a failed first search once more before giving up", async () => {
    const h = createHarness();
    search
      .mockRejectedValueOnce(new Error("Tavily search failed (status 502)"))
      .mockResolvedValueOnce(answer("https://developers.notion.com/docs"));
    const update = await resolveNode(makeState({ typed: "Notion" }), h.config);
    expect(update.app).toMatchObject({ domain: "notion.com" });
    expect(search).toHaveBeenCalledTimes(2);
    expect(error).not.toHaveBeenCalled();
    expect(search.mock.calls[1]?.[1]).toMatchObject({ timeoutMs: 3_000 });
  });

  it("ends INTERNAL, and logs once, when the retry fails too", async () => {
    const h = createHarness();
    search.mockRejectedValue(new Error("Tavily search failed (status 502)"));
    const update = await resolveNode(makeState({ typed: "Notion" }), h.config);
    expect(update.failure).toMatchObject({ stage: 0, code: "INTERNAL" });
    expect(search).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledTimes(1);
  });
});
