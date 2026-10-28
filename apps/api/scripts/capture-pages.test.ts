/**
 * File: capture-pages.test.ts
 * Purpose: Tests the capture helpers: tiering, which pages get fetched, and the page text cap.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { ExtractResult, SearchResult } from "../src/lib/tavily.js";
import { capPages, pickPageUrls, tierOf } from "./capture-pages.js";

const hits = (...urls: string[]): SearchResult => ({
  hits: urls.map((url) => ({ url, title: "", snippet: "", score: 0 })),
  credits: null,
});
const DOMAINS = ["notion.com", "notion.so"];

describe("tierOf", () => {
  it("is official on any of the app's domains and their subdomains", () => {
    expect(tierOf("https://developers.notion.com/docs", DOMAINS)).toBe(
      "official",
    );
    expect(tierOf("https://www.notion.so/help", DOMAINS)).toBe("official");
  });

  it("is forum for a community subdomain, even on the official domain", () => {
    expect(tierOf("https://community.notion.com/t/1", DOMAINS)).toBe("forum");
    expect(tierOf("https://stackoverflow.com/q/1", DOMAINS)).toBe("forum");
  });

  it("is third_party for another site, including a lookalike domain", () => {
    expect(tierOf("https://blog.example.net/notion", DOMAINS)).toBe(
      "third_party",
    );
    expect(tierOf("https://evilnotion.com/docs", DOMAINS)).toBe("third_party");
  });
});

describe("pickPageUrls", () => {
  const a = "https://developers.notion.com/a";
  const b = "https://developers.notion.com/b";
  const c = "https://developers.notion.com/c";
  const d = "https://developers.notion.com/d";
  const outside = "https://blog.example.net/notion";

  it("takes each topic's best page first, then the next best", () => {
    expect(pickPageUrls([hits(a, b), hits(c, d)], null, DOMAINS, 6)).toEqual([
      a,
      c,
      b,
      d,
    ]);
  });

  it("skips a page two topics both found", () => {
    expect(pickPageUrls([hits(a, b), hits(a, c)], null, DOMAINS, 6)).toEqual([
      a,
      b,
      c,
    ]);
  });

  it("reserves one slot for a page from outside the official domains", () => {
    const topics = [
      hits(a, b, c),
      hits(
        d,
        "https://developers.notion.com/e",
        "https://developers.notion.com/f",
      ),
    ];
    const picked = pickPageUrls(topics, hits(outside), DOMAINS, 4);
    expect(picked).toHaveLength(4);
    expect(picked.at(-1)).toBe(outside);
  });

  it("uses every slot for official pages when the open search found nothing outside", () => {
    const picked = pickPageUrls([hits(a, b, c, d)], hits(a), DOMAINS, 3);
    expect(picked).toEqual([a, b, c]);
  });

  it("takes the first non-official hit from the open search, not an official one", () => {
    expect(pickPageUrls([hits(a)], hits(b, outside), DOMAINS, 6)).toEqual([
      a,
      outside,
    ]);
  });

  it("ignores non-official hits inside the topic searches", () => {
    expect(pickPageUrls([hits(outside, a)], null, DOMAINS, 6)).toEqual([a]);
  });

  it("returns nothing when no topic search found an official page", () => {
    expect(pickPageUrls([], null, DOMAINS, 6)).toEqual([]);
    expect(pickPageUrls([hits(outside)], null, DOMAINS, 6)).toEqual([]);
  });
});

describe("capPages", () => {
  const result = (text: string): ExtractResult => ({
    pages: [{ url: "https://a.example.com/x", title: "T", text }],
    failed: [{ url: "https://a.example.com/y", error: "boom" }],
    credits: 2,
  });

  it("keeps text at or under the cap and records nothing", () => {
    const capped = capPages(result("x".repeat(10)), 10);
    expect(capped.result.pages[0]?.text).toHaveLength(10);
    expect(capped.truncated).toEqual([]);
  });

  it("cuts text one character over the cap and records the full length", () => {
    const capped = capPages(result("x".repeat(11)), 10);
    expect(capped.result.pages[0]?.text).toBe("x".repeat(10));
    expect(capped.truncated).toEqual([
      { url: "https://a.example.com/x", originalLength: 11 },
    ]);
  });

  it("leaves titles, failed pages and credits alone", () => {
    const capped = capPages(result("x".repeat(50)), 10);
    expect(capped.result.pages[0]?.title).toBe("T");
    expect(capped.result.failed).toEqual(result("").failed);
    expect(capped.result.credits).toBe(2);
  });
});
