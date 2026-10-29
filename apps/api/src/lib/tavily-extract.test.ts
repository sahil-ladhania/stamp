/**
 * File: tavily-extract.test.ts
 * Purpose: Tests extractPages with a fake client: request shape, page results, limits, counters and failures.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeTavily } from "../test-support/fake-tavily.js";
import { createRunUsage } from "./usage.js";

vi.mock("@tavily/core", async () => {
  const { fakeTavily } = await import("../test-support/fake-tavily.js");
  return {
    tavily: () => {
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

const { extractPages } = await import("./tavily.js");

const page = (
  url: string,
  rawContent: string,
  title: string | null = "Title",
) => ({ url, title, rawContent });

beforeEach(() => fakeTavily.reset());

describe("extractPages results", () => {
  it("returns pages with normalised URLs, titles and text, plus the credits", async () => {
    fakeTavily.extract.mockResolvedValue({
      results: [
        page("https://Docs.example.com/oauth#x", "Create an app first."),
      ],
      failedResults: [],
      usage: { credits: 1 },
    });
    expect(
      await extractPages(["https://docs.example.com/oauth"], {
        timeoutMs: 10_000,
      }),
    ).toEqual({
      pages: [
        {
          url: "https://docs.example.com/oauth",
          title: "Title",
          text: "Create an app first.",
        },
      ],
      failed: [],
      credits: 1,
    });
  });

  it("reports pages with no text as failed, alongside the failures Tavily returns", async () => {
    fakeTavily.extract.mockResolvedValue({
      results: [
        page("https://example.com/empty", "   \n"),
        page("https://example.com/ok", "Real text", null),
      ],
      failedResults: [
        { url: "https://example.com/blocked", error: "Forbidden" },
      ],
    });
    const result = await extractPages(
      [
        "https://example.com/empty",
        "https://example.com/ok",
        "https://example.com/blocked",
      ],
      {
        timeoutMs: 10_000,
      },
    );
    expect(result.pages).toEqual([
      { url: "https://example.com/ok", title: null, text: "Real text" },
    ]);
    expect(result.failed).toEqual([
      { url: "https://example.com/blocked", error: "Forbidden" },
      { url: "https://example.com/empty", error: "No text content" },
    ]);
    expect(result.credits).toBeNull();
  });
});

describe("extractPages request", () => {
  beforeEach(() =>
    fakeTavily.extract.mockResolvedValue({ results: [], failedResults: [] }),
  );

  it("sends unique normalised URLs as markdown with basic depth and usage reporting", async () => {
    await extractPages(
      [
        "https://example.com/a?utm_source=x",
        "https://example.com/a#frag",
        "https://example.com/b",
        "not a url",
      ],
      { timeoutMs: 9500 },
    );
    expect(fakeTavily.extract).toHaveBeenCalledWith(
      ["https://example.com/a", "https://example.com/b"],
      {
        extractDepth: "basic",
        format: "markdown",
        includeImages: false,
        includeUsage: true,
        timeout: 10,
      },
    );
  });

  it("rewrites links in the page text so a name shown only as a link stays readable", async () => {
    fakeTavily.extract.mockResolvedValue({
      results: [
        {
          url: "https://example.com/scopes",
          title: "Scopes",
          rawContent:
            "| [https://api.example.com/auth/mail.labels](https://api.example.com/auth/mail.labels) | See labels. |",
        },
      ],
      failedResults: [],
    });
    const result = await extractPages(["https://example.com/scopes"], {
      timeoutMs: 9500,
    });
    expect(result.pages[0]?.text).toBe(
      "| https://api.example.com/auth/mail.labels | See labels. |",
    );
  });

  it("makes no request when there is nothing usable to fetch", async () => {
    const usage = createRunUsage();
    expect(await extractPages([], { timeoutMs: 1000, usage })).toEqual({
      pages: [],
      failed: [],
      credits: null,
    });
    expect(
      await extractPages(["not a url", "ftp://x.com/f"], {
        timeoutMs: 1000,
        usage,
      }),
    ).toEqual({
      pages: [],
      failed: [],
      credits: null,
    });
    expect(fakeTavily.extract).not.toHaveBeenCalled();
    expect(usage.tavily.extractCalls).toBe(0);
  });

  it("refuses more than 10 URLs at once, without calling Tavily", async () => {
    const urls = Array.from(
      { length: 11 },
      (_, i) => `https://example.com/${i}`,
    );
    await expect(extractPages(urls, { timeoutMs: 1000 })).rejects.toThrow(
      RangeError,
    );
    expect(fakeTavily.extract).not.toHaveBeenCalled();
  });
});
