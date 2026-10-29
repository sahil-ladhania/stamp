/**
 * File: resolve-summary.test.ts
 * Purpose: Tests the resolve summary log line used to tune the ambiguity thresholds: the decision and the top candidates with their scores.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { searchWeb } from "../../lib/tavily.js";
import { createHarness, makeState } from "../../test-support/graph-harness.js";
import { hit } from "../../test-support/node-fixtures.js";
import { resolveNode } from "./resolve.js";

vi.mock("../../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
const search = vi.mocked(searchWeb);
const info = vi.spyOn(logger, "info");

beforeEach(() => {
  search.mockReset();
  info.mockReset().mockImplementation(() => {});
});

const run = (typed: string) =>
  resolveNode(makeState({ typed, slug: "x" }), createHarness().config);
const summary = () =>
  info.mock.calls.find(([m]) => m === "resolve summary")?.[1] as Record<
    string,
    unknown
  >;

describe("the resolve summary line", () => {
  it("logs the decision and the ranked candidates with rounded scores", async () => {
    search.mockResolvedValue({
      hits: [
        hit("https://developers.notion.com/docs"),
        hit("https://www.notion.so/help"),
      ],
      credits: 1,
    });
    await run("Notion");
    expect(summary()).toMatchObject({
      runId: "run_1",
      name: "Notion",
      decision: "official",
      hits: 2,
    });
    const candidates = summary().candidates as {
      domain: string;
      match: string;
      score: number;
      hits: number;
    }[];
    expect(candidates[0]).toMatchObject({
      domain: "notion.com",
      match: "exact",
      hits: 1,
    });
    expect(Number.isInteger(candidates[0]!.score * 100)).toBe(true);
  });

  it("logs the identity it derived, the official domains and the product phrase, so a run's searches can be explained", async () => {
    search.mockResolvedValue({
      hits: [
        hit(
          "https://developers.google.com/workspace/gmail/api/guides",
          0.9,
          "Gmail API overview  |  Google for Developers",
        ),
        hit(
          "https://developers.google.com/workspace/gmail/api/reference/rest",
          0.8,
          "Gmail API  |  Google for Developers",
        ),
      ],
      credits: 1,
    });
    await run("Gmail");
    expect(summary()).toMatchObject({
      identity: { domains: ["google.com"], product: "Gmail API" },
    });
  });

  it("logs a null product when the titles agree on none", async () => {
    search.mockResolvedValue({
      hits: [hit("https://developers.notion.com/docs")],
      credits: 1,
    });
    await run("Notion");
    expect(summary()).toMatchObject({
      identity: { domains: ["notion.com"], product: null },
    });
  });

  it("logs the ambiguous decision too, with both candidates", async () => {
    search.mockResolvedValue({
      hits: [hit("https://mercury.com/"), hit("https://docs.mercuryapp.io/x")],
      credits: 1,
    });
    await run("Mercury");
    expect(summary()).toMatchObject({ decision: "ambiguous" });
    expect(
      (summary().candidates as { domain: string }[]).map((c) => c.domain),
    ).toEqual(["mercury.com", "mercuryapp.io"]);
  });

  it("logs at most five candidates", async () => {
    const urls = ["a", "b", "c", "d", "e", "f", "g"].map(
      (x) => `https://docs.${x}-site.org/p`,
    );
    search.mockResolvedValue({ hits: urls.map((u) => hit(u)), credits: 1 });
    await run("Notion");
    expect(summary().candidates).toHaveLength(5);
  });

  it("logs nothing for a typed domain, which needs no search", async () => {
    await run("https://developers.notion.com/docs");
    expect(summary()).toBeUndefined();
  });

  it("logs the decision when nothing matches", async () => {
    search.mockResolvedValue({
      hits: [hit("https://example.org/page")],
      credits: 1,
    });
    await run("Zzqx Unknownapp");
    expect(summary()).toMatchObject({ decision: "none" });
  });
});

describe("the resolve summary line resolveHits", () => {
  it("logs the URL and title of each hit and nothing from the page", async () => {
    search.mockResolvedValue({
      hits: [
        hit("https://developers.notion.com/docs"),
        hit("https://www.notion.so/help"),
      ],
      credits: 1,
    });
    await run("Notion");
    const hits = summary().resolveHits as Record<string, unknown>[];
    expect(hits).toHaveLength(2);
    expect(hits[0]).toEqual({
      url: "https://developers.notion.com/docs",
      title: expect.any(String),
    });
  });
});
