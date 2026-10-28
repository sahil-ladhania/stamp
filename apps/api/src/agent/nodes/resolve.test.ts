/**
 * File: resolve.test.ts
 * Purpose: Tests the resolve stage with a mocked Tavily search: domain input, name search, ambiguity, no docs and errors.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { searchWeb } from "../../lib/tavily.js";
import { RUN_ERROR_MESSAGES } from "../../services/run-messages.js";
import {
  createHarness,
  makeState,
  trace,
} from "../../test-support/graph-harness.js";
import { hit } from "../../test-support/node-fixtures.js";
import { RESOLVE_QUERY, resolveNode } from "./resolve.js";

vi.mock("../../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
const search = vi.mocked(searchWeb);
const error = vi.spyOn(logger, "error");

const found = (...urls: string[]) =>
  search.mockResolvedValue({ hits: urls.map((url) => hit(url)), credits: 1 });

beforeEach(() => {
  search.mockReset();
  error.mockReset().mockImplementation(() => {});
});

describe("resolveNode with a typed domain or URL", () => {
  it("takes the official domain from it without searching", async () => {
    const h = createHarness();
    const update = await resolveNode(
      makeState({
        typed: "https://developers.notion.com/docs",
        slug: "notion",
      }),
      h.config,
    );
    expect(update.app).toEqual({
      appName: "Notion",
      domain: "notion.com",
      slug: "notion",
    });
    expect(search).not.toHaveBeenCalled();
    expect(trace(h.events)).toEqual(["stage.started:0", "stage.done:0"]);
  });
});

describe("resolveNode with an app name", () => {
  it("searches once, emits the query and returns the official domain with the run's slug", async () => {
    const h = createHarness();
    found("https://developers.notion.com/docs", "https://www.notion.so/help");
    const update = await resolveNode(
      makeState({ typed: "Notion", slug: "notion" }),
      h.config,
    );
    expect(update.app).toEqual({
      appName: "Notion",
      domain: "notion.com",
      slug: "notion",
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(h.events.filter((e) => e.type === "search.query")).toEqual([
      {
        type: "search.query",
        runId: "run_1",
        query: "Notion API developer documentation",
      },
    ]);
  });

  it("asks Tavily for 8 results within the resolve time cap, passing the run's meter and signal", async () => {
    const h = createHarness();
    found("https://notion.com/");
    await resolveNode(makeState({ typed: "Notion" }), h.config);
    expect(search).toHaveBeenCalledWith(
      RESOLVE_QUERY("Notion"),
      expect.objectContaining({
        maxResults: 8,
        timeoutMs: 6_000,
        usage: h.deps.usage,
        runId: "run_1",
        signal: h.controller.signal,
      }),
    );
  });

  it("capitalises a name typed in lower case and cleans stray whitespace", async () => {
    const h = createHarness();
    found("https://notion.com/");
    const update = await resolveNode(
      makeState({ typed: "  notion \n" }),
      h.config,
    );
    expect(update.app).toMatchObject({ appName: "Notion" });
    expect(search.mock.calls[0]?.[0]).toBe(
      "Notion API developer documentation",
    );
  });

  it("skips forums and code hosts when picking the domain", async () => {
    const h = createHarness();
    found(
      "https://github.com/slackapi/x",
      "https://stackoverflow.com/q/1",
      "https://api.slack.com/authentication/oauth-v2",
    );
    const update = await resolveNode(makeState({ typed: "Slack" }), h.config);
    expect(update.app).toMatchObject({ domain: "slack.com" });
  });
});

describe("resolveNode when it cannot decide", () => {
  it("ends the run with AMBIGUOUS_APP and the options when two apps match about equally", async () => {
    const h = createHarness();
    found("https://mercury.com/", "https://docs.mercuryapp.io/x");
    const update = await resolveNode(makeState({ typed: "Mercury" }), h.config);
    expect(update.failure).toEqual({
      stage: 0,
      code: "AMBIGUOUS_APP",
      message: RUN_ERROR_MESSAGES.AMBIGUOUS_APP,
      options: [
        { name: "Mercury", domain: "mercury.com" },
        { name: "Mercuryapp", domain: "mercuryapp.io" },
      ],
    });
    expect(update.app).toBeUndefined();
    expect(trace(h.events)).toEqual(["stage.started:0", "search.query"]);
  });

  it("ends the run with NO_PUBLIC_DOCS when the search finds nothing", async () => {
    const h = createHarness();
    found();
    const update = await resolveNode(
      makeState({ typed: "Zzqx Unknownapp" }),
      h.config,
    );
    expect(update.failure).toMatchObject({ stage: 0, code: "NO_PUBLIC_DOCS" });
  });

  it("ends the run with NO_PUBLIC_DOCS when nothing found matches the name", async () => {
    const h = createHarness();
    found("https://example.org/page", "https://other.net/x");
    const update = await resolveNode(
      makeState({ typed: "Zzqx Unknownapp" }),
      h.config,
    );
    expect(update.failure).toMatchObject({ code: "NO_PUBLIC_DOCS" });
  });

  it("ends the run with NO_PUBLIC_DOCS for a blank name, without searching", async () => {
    const h = createHarness();
    const update = await resolveNode(makeState({ typed: "   " }), h.config);
    expect(update.failure).toMatchObject({ code: "NO_PUBLIC_DOCS" });
    expect(search).not.toHaveBeenCalled();
  });
});

describe("resolveNode errors", () => {
  it("ends the run with INTERNAL when the search fails, logging the error without its cause", async () => {
    const h = createHarness();
    search.mockRejectedValue(
      Object.assign(new Error("Tavily search failed (status 500)"), {
        cause: { key: "tvly-secret" },
      }),
    );
    const update = await resolveNode(makeState({ typed: "Notion" }), h.config);
    expect(update.failure).toMatchObject({ stage: 0, code: "INTERNAL" });
    expect(JSON.stringify(error.mock.calls)).not.toContain("tvly-secret");
    expect(error).toHaveBeenCalledWith("resolve search failed", {
      runId: "run_1",
      detail: "Error: Tavily search failed (status 500)",
    });
  });

  it("lets an abort through instead of reporting a failure", async () => {
    const h = createHarness();
    search.mockImplementation(() => {
      h.controller.abort();
      return Promise.reject(new Error("aborted"));
    });
    await expect(
      resolveNode(makeState({ typed: "Notion" }), h.config),
    ).rejects.toBeDefined();
    expect(error).not.toHaveBeenCalled();
  });
});
