/**
 * File: order-results.test.ts
 * Purpose: Tests tiering of search hits against the official domain, de-duplication and the official-first ordering.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { SearchHit } from "../../lib/tavily.js";
import type { SearchResult } from "../search-result.js";
import { orderResults, toSearchResults } from "./order-results.js";

const hit = (url: string, score = 0.5, title = "T"): SearchHit => ({
  url,
  title,
  snippet: "s",
  score,
});
const result = (
  url: string,
  tier: SearchResult["tier"],
  score?: number,
): SearchResult => ({
  url,
  tier,
  ...(score === undefined ? {} : { score }),
});

describe("toSearchResults", () => {
  it("tiers hits against the official domain, with subdomains official and lookalikes not", () => {
    const tiers = toSearchResults(
      [
        hit("https://developers.hubspot.com/docs"),
        hit("https://community.hubspot.com/t/1"),
        hit("https://stackoverflow.com/q/1"),
        hit("https://evilhubspot.com/x"),
        hit("https://blog.example.net/hubspot"),
      ],
      "hubspot.com",
    ).map((r) => r.tier);
    expect(tiers).toEqual([
      "official",
      "forum",
      "forum",
      "third_party",
      "third_party",
    ]);
  });

  it("tiers against every official domain of a company, so its second documentation site is official", () => {
    const results = toSearchResults(
      [
        hit("https://docs.slack.dev/authentication"),
        hit("https://api.slack.com/legacy"),
        hit("https://example.net/slack"),
      ],
      ["slack.com", "slack.dev"],
    );
    expect(results.map((r) => r.tier)).toEqual([
      "official",
      "official",
      "third_party",
    ]);
  });

  it("drops a repeated URL and keeps the first", () => {
    const results = toSearchResults(
      [
        hit("https://a.hubspot.com/x", 0.9),
        hit("https://a.hubspot.com/x", 0.1),
      ],
      "hubspot.com",
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.score).toBe(0.9);
  });

  it("keeps the title and score, and omits an empty title", () => {
    const [withTitle, noTitle] = toSearchResults(
      [hit("https://a.com/1", 0.7, "Guide"), hit("https://a.com/2", 0.2, "")],
      "a.com",
    );
    expect(withTitle).toEqual({
      url: "https://a.com/1",
      tier: "official",
      title: "Guide",
      score: 0.7,
    });
    expect(noTitle).toEqual({
      url: "https://a.com/2",
      tier: "official",
      score: 0.2,
    });
  });

  it("returns nothing for no hits", () => {
    expect(toSearchResults([], "a.com")).toEqual([]);
  });
});

describe("orderResults", () => {
  it("puts official before third party before forum", () => {
    const ordered = orderResults([
      result("f", "forum"),
      result("t", "third_party"),
      result("o", "official"),
    ]);
    expect(ordered.map((r) => r.url)).toEqual(["o", "t", "f"]);
  });

  it("orders by score within a tier, highest first", () => {
    const ordered = orderResults([
      result("a", "official", 0.2),
      result("b", "official", 0.9),
      result("c", "official", 0.5),
    ]);
    expect(ordered.map((r) => r.url)).toEqual(["b", "c", "a"]);
  });

  it("ranks a tier above a better score in a worse tier", () => {
    const ordered = orderResults([
      result("t", "third_party", 0.99),
      result("o", "official", 0.01),
    ]);
    expect(ordered.map((r) => r.url)).toEqual(["o", "t"]);
  });

  it("keeps the given order for equal results and treats a missing score as 0", () => {
    const ordered = orderResults([
      result("a", "official"),
      result("b", "official"),
      result("c", "official", 0.1),
    ]);
    expect(ordered.map((r) => r.url)).toEqual(["c", "a", "b"]);
  });

  it("does not change the list it was given", () => {
    const input = [result("f", "forum"), result("o", "official")];
    orderResults(input);
    expect(input.map((r) => r.url)).toEqual(["f", "o"]);
  });
});

describe("toSearchResults topics", () => {
  const tagged = (url: string, topic?: string) => ({ ...hit(url), topic });

  it("records the topic of the query that returned each result", () => {
    const [first] = toSearchResults(
      [tagged("https://docs.acme.com/a", "setup")],
      "acme.com",
    );
    expect(first?.topics).toEqual(["setup"]);
  });

  it("merges the topics of a repeated URL and keeps the first hit", () => {
    const results = toSearchResults(
      [
        { ...tagged("https://docs.acme.com/a", "setup"), title: "First" },
        { ...tagged("https://docs.acme.com/a", "scopes"), title: "Second" },
        tagged("https://docs.acme.com/a", "setup"),
      ],
      "acme.com",
    );
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "First",
      topics: ["setup", "scopes"],
    });
  });

  it("adds no topics field when no query topic is given", () => {
    const [first] = toSearchResults(
      [hit("https://docs.acme.com/a")],
      "acme.com",
    );
    expect(first).not.toHaveProperty("topics");
  });
});
