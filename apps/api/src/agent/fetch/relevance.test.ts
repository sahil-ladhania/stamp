/**
 * File: relevance.test.ts
 * Purpose: Tests scoring how well a search result answers the question its topic asks, from its title, URL and score.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { SearchResult } from "../search-result.js";
import { relevance, topicFit } from "./relevance.js";

const result = (
  url: string,
  title: string | undefined,
  topics: string[] = [],
  score = 0.5,
): SearchResult => ({
  url,
  tier: "official",
  ...(title === undefined ? {} : { title }),
  score,
  topics,
});
const none = { product: null };

describe("relevance", () => {
  it("is just the search score for a result with no title and no topic", () => {
    expect(
      relevance(result("https://x.com/a", undefined, [], 0.7), none),
    ).toBeCloseTo(0.7);
    expect(relevance({ url: "https://x.com/a", tier: "official" }, none)).toBe(
      0,
    );
  });

  it("rewards a title that answers the topic's question and, less, a URL that does", () => {
    const inTitle = result("https://x.com/p", "Scopes for apps", ["scopes"]);
    const inPath = result("https://x.com/scopes", "Reference", ["scopes"]);
    const neither = result("https://x.com/p", "Reference", ["scopes"]);
    expect(relevance(inTitle, none)).toBeGreaterThan(relevance(inPath, none));
    expect(relevance(inPath, none)).toBeGreaterThan(relevance(neither, none));
  });

  it("uses the best of the topics a result was found for", () => {
    const multi = result("https://x.com/p", "App review and approval", [
      "scopes",
      "review",
    ]);
    expect(topicFit(multi)).toBeGreaterThan(0);
    expect(topicFit(result("https://x.com/p", "App review", ["scopes"]))).toBe(
      0,
    );
  });

  it("rewards OAuth words in the title and a documentation host", () => {
    const base = result("https://example.com/page", "Welcome");
    expect(
      relevance(result("https://example.com/page", "OAuth guide"), none),
    ).toBeGreaterThan(relevance(base, none));
    expect(
      relevance(result("https://docs.example.com/page", "Welcome"), none),
    ).toBeGreaterThan(relevance(base, none));
  });

  it("rewards the product phrase in the title", () => {
    const page = result("https://x.com/p", "Gmail API overview");
    expect(relevance(page, { product: "Gmail API" })).toBeGreaterThan(
      relevance(page, none),
    );
  });

  it.each([
    "https://x.com/blog/oauth-guide",
    "https://x.com/community/t/oauth",
    "https://x.com/discussions/12",
    "https://x.com/issues/12",
    "https://x.com/questions/12/oauth",
    "https://x.com/answers/oauth",
    "https://x.com/templates/oauth",
  ])("softly penalises a page on a community or blog path: %s", (url) => {
    const plain = result("https://x.com/guide", "OAuth app review", ["review"]);
    expect(
      relevance(result(url, "OAuth app review", ["review"]), none),
    ).toBeLessThan(relevance(plain, none));
  });

  it("keeps a strong title on a penalised path above a weak title on a plain one", () => {
    const faq = result(
      "https://support.example.com/cloud/answer/13463817",
      "OAuth app verification FAQ",
      ["review"],
    );
    const weak = result("https://developers.example.com/guides", "Overview", [
      "review",
    ]);
    expect(relevance(faq, none)).toBeGreaterThan(relevance(weak, none));
  });

  it.each([
    ["Legacy OAuth scopes", "https://x.com/scopes"],
    ["OAuth scopes (deprecated)", "https://x.com/scopes"],
    ["OAuth scopes", "https://x.com/legacy/scopes"],
  ])("penalises a legacy page: %s %s", (title, url) => {
    const current = result("https://x.com/scopes", "OAuth scopes", ["scopes"]);
    expect(relevance(result(url, title, ["scopes"]), none)).toBeLessThan(
      relevance(current, none),
    );
  });

  it("uses the search score only to separate otherwise equal results", () => {
    const high = result("https://x.com/a", "OAuth scopes", ["scopes"], 0.9);
    const low = result("https://x.com/b", "OAuth scopes", ["scopes"], 0.2);
    expect(relevance(high, none)).toBeGreaterThan(relevance(low, none));
    const fit = result("https://x.com/c", "OAuth scopes", ["scopes"], 0.1);
    const miss = result("https://x.com/d", "Welcome", ["scopes"], 1);
    expect(relevance(fit, none)).toBeGreaterThan(relevance(miss, none));
  });
});
