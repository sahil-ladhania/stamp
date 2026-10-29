/**
 * File: select-pages-relevance.test.ts
 * Purpose: Tests choosing pages by relevance: one page per topic first, the best title first, a reserved slot for a non-official page only past the relevance floor, and no locale repeats.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { SearchResult } from "../search-result.js";
import { selectPages } from "./select-pages.js";

const page = (
  path: string,
  title: string,
  topics: string[],
  score = 0.5,
  tier: SearchResult["tier"] = "official",
  host = "docs.acme.com",
): SearchResult => ({
  url: `https://${host}/${path}`,
  tier,
  title,
  score,
  topics,
});
const names = (picked: SearchResult[]) =>
  picked.map((p) => p.url.split("/").pop());
const pick = (
  results: SearchResult[],
  allowance: number,
  product: string | null = null,
) => selectPages(results, { allowance, held: new Set(), product });

describe("selectPages by relevance", () => {
  it("reads the page whose title answers the topic before a higher-scored page that does not", () => {
    const picked = pick(
      [
        page("welcome", "Welcome", ["scopes"], 0.9),
        page("scopes", "OAuth scopes", ["scopes"], 0.4),
      ],
      1,
    );
    expect(names(picked)).toEqual(["scopes"]);
  });

  it("covers a topic nobody else covers before a second page for a topic already covered", () => {
    const picked = pick(
      [
        page("setup-a", "Create an OAuth app", ["setup"], 0.9),
        page("setup-b", "Register an OAuth app", ["setup"], 0.85),
        page("review", "App review and approval", ["review"], 0.4),
      ],
      2,
    );
    expect(names(picked)).toEqual(
      expect.arrayContaining(["setup-a", "review"]),
    );
    expect(names(picked)).not.toContain("setup-b");
  });

  it("counts a page found for several topics as covering all of them", () => {
    const picked = pick(
      [
        page("both", "OAuth scopes and app review", ["scopes", "review"], 0.5),
        page("scopes-only", "OAuth scopes", ["scopes"], 0.6),
        page("limits", "Rate limits", ["limits"], 0.4),
      ],
      2,
    );
    expect(names(picked)).toEqual(expect.arrayContaining(["both", "limits"]));
  });

  it("puts a community or blog page after the documentation, but still before nothing", () => {
    const picked = pick(
      [
        page("blog/oauth-review", "OAuth app review", ["review"], 0.9),
        page("guides/review", "OAuth app review", ["review"], 0.5),
      ],
      2,
    );
    expect(names(picked)).toEqual(["review", "oauth-review"]);
  });

  it("still returns pages when none has a title or topic, in score order", () => {
    const bare = (n: number, score: number): SearchResult => ({
      url: `https://docs.acme.com/p${n}`,
      tier: "official",
      score,
    });
    expect(names(pick([bare(1, 0.2), bare(2, 0.9), bare(3, 0.5)], 2))).toEqual([
      "p2",
      "p3",
    ]);
  });

  it("does not read the same page in two languages", () => {
    const picked = pick(
      [
        page(
          "help/snowflake",
          "Snowflake",
          ["setup"],
          0.9,
          "official",
          "www.acme.com",
        ),
        {
          ...page("x", "Snowflake", ["setup"], 0.8, "official", "www.acme.com"),
          url: "https://www.acme.com/es-es/help/snowflake",
        },
        page("other", "OAuth app setup", ["setup"], 0.3),
      ],
      3,
    );
    expect(
      picked.filter((p) => p.url.endsWith("/help/snowflake")),
    ).toHaveLength(1);
  });
});

describe("selectPages reserved slot", () => {
  const official = (n: number) =>
    page(`o${n}`, "OAuth scopes", ["scopes"], 0.9 - n / 100);

  it("goes to a non-official page that answers a topic", () => {
    const third = page(
      "t",
      "OAuth app review times",
      ["approvalWait"],
      0.4,
      "third_party",
      "blog.example.net",
    );
    const picked = pick(
      [official(1), official(2), official(3), official(4), third],
      4,
    );
    expect(names(picked)).toContain("t");
  });

  it("is given back to the official pages when the non-official ones answer no topic", () => {
    const vague = page(
      "v",
      "Our company news",
      [],
      0.95,
      "third_party",
      "blog.example.net",
    );
    const picked = pick(
      [official(1), official(2), official(3), official(4), vague],
      4,
    );
    expect(names(picked)).toEqual(["o1", "o2", "o3", "o4"]);
  });

  it("is not kept when the allowance is under three", () => {
    const third = page(
      "t",
      "OAuth app review times",
      ["approvalWait"],
      0.4,
      "third_party",
      "blog.example.net",
    );
    expect(names(pick([official(1), official(2), third], 2))).toEqual([
      "o1",
      "o2",
    ]);
  });
});
