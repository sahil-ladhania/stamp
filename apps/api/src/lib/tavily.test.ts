/**
 * File: tavily.test.ts
 * Purpose: Tests searchWeb with a fake client: request options, typed hits, dedupe and client creation.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeTavily } from "../test-support/fake-tavily.js";

const factory = vi.hoisted(() => vi.fn());
vi.mock("@tavily/core", async () => {
  const { fakeTavily } = await import("../test-support/fake-tavily.js");
  return {
    tavily: (options: unknown) => {
      factory(options);
      return fakeTavily;
    },
  };
});
vi.mock("../config.js", async (importOriginal) => {
  const { realAgentConfig } = await import("../test-support/real-config.js");
  return {
    ...(await importOriginal<typeof import("../config.js")>()),
    getConfig: () => realAgentConfig,
  };
});

const { searchWeb } = await import("./tavily.js");

const hit = (url: string, extra: object = {}) => ({
  url,
  title: "T",
  content: "C",
  score: 0.9,
  ...extra,
});

beforeEach(() => fakeTavily.reset());

describe("searchWeb results", () => {
  it("returns typed hits with normalised URLs and the reported credits", async () => {
    fakeTavily.search.mockResolvedValue({
      results: [
        hit("https://Docs.Example.com/oauth?utm_source=x#top", {
          title: "OAuth",
          content: "Setup",
          score: 0.8,
        }),
      ],
      usage: { credits: 1 },
    });
    const result = await searchWeb("notion oauth", { timeoutMs: 5000 });
    expect(result).toEqual({
      hits: [
        {
          url: "https://docs.example.com/oauth",
          title: "OAuth",
          snippet: "Setup",
          score: 0.8,
        },
      ],
      credits: 1,
    });
  });

  it("removes duplicates after normalisation, keeping the first, and drops unusable URLs", async () => {
    fakeTavily.search.mockResolvedValue({
      results: [
        hit("https://example.com/a?utm_campaign=1", { title: "first" }),
        hit("https://example.com/a#section", { title: "dupe" }),
        hit("not a url"),
        hit("ftp://example.com/file"),
        hit("https://example.com/b"),
      ],
    });
    const { hits } = await searchWeb("q", { timeoutMs: 5000 });
    expect(hits.map((h) => [h.url, h.title])).toEqual([
      ["https://example.com/a", "first"],
      ["https://example.com/b", "T"],
    ]);
  });

  it("fills missing title, snippet and score, and reports null credits without usage", async () => {
    fakeTavily.search.mockResolvedValue({
      results: [{ url: "https://example.com/a" }],
    });
    expect(await searchWeb("q", { timeoutMs: 5000 })).toEqual({
      hits: [
        { url: "https://example.com/a", title: "", snippet: "", score: 0 },
      ],
      credits: null,
    });
  });

  it("returns no hits for an empty result list", async () => {
    fakeTavily.search.mockResolvedValue({ results: [] });
    expect((await searchWeb("q", { timeoutMs: 5000 })).hits).toEqual([]);
  });
});

describe("searchWeb request", () => {
  beforeEach(() => fakeTavily.search.mockResolvedValue({ results: [] }));

  it("asks for basic depth, 5 results and usage, and rounds the timeout up to whole seconds", async () => {
    await searchWeb("notion oauth", { timeoutMs: 5500 });
    expect(fakeTavily.search).toHaveBeenCalledWith("notion oauth", {
      searchDepth: "basic",
      maxResults: 5,
      includeAnswer: false,
      includeRawContent: false,
      includeUsage: true,
      timeout: 6,
    });
  });

  it("restricts to the given domains and result count, and never sends an empty domain list", async () => {
    await searchWeb("q", {
      timeoutMs: 800,
      maxResults: 8,
      includeDomains: ["hubspot.com"],
    });
    expect(fakeTavily.search.mock.calls[0]?.[1]).toMatchObject({
      includeDomains: ["hubspot.com"],
      maxResults: 8,
      timeout: 1,
    });
    await searchWeb("q", { timeoutMs: 800, includeDomains: [] });
    expect(fakeTavily.search.mock.calls[1]?.[1]).not.toHaveProperty(
      "includeDomains",
    );
  });

  it("creates the client once with the configured key", async () => {
    await searchWeb("a", { timeoutMs: 1000 });
    await searchWeb("b", { timeoutMs: 1000 });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith({ apiKey: "tvly-secret-key" });
  });
});
