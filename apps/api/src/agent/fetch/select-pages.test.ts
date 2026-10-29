/**
 * File: select-pages.test.ts
 * Purpose: Tests page selection: official first, the reserved non-official slot, held pages, duplicates and unfetchable URLs.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { hashUrl } from "../../utils/hash-url.js";
import type { SearchResult } from "../search-result.js";
import { MIN_PAGE_CHARS, isFetchable, selectPages } from "./select-pages.js";

const r = (
  url: string,
  tier: SearchResult["tier"],
  score = 0.5,
): SearchResult => ({ url, tier, score });
const o = (n: number, score = 0.5) =>
  r(`https://docs.acme.com/o${n}`, "official", score);
const t = (n: number) => r(`https://blog.example.net/t${n}`, "third_party");
const f = (n: number) => r(`https://forum.example.org/f${n}`, "forum");
const urls = (results: SearchResult[]) =>
  results.map((x) => x.url.split("/").pop());
const none = new Set<string>();

describe("selectPages", () => {
  it("takes official pages first, up to the allowance", () => {
    expect(
      urls(selectPages([o(1), o(2), o(3), t(1)], { allowance: 2, held: none })),
    ).toEqual(["o1", "o2"]);
  });

  it("uses every slot for official pages when there is no non-official page", () => {
    expect(
      urls(
        selectPages([o(1), o(2), o(3), o(4), o(5)], {
          allowance: 4,
          held: none,
        }),
      ),
    ).toEqual(["o1", "o2", "o3", "o4"]);
  });

  it("fills slots with non-official pages when there are few official ones", () => {
    const picked = selectPages([o(1), t(1), t(2), t(3), t(4)], {
      allowance: 4,
      held: none,
    });
    expect(urls(picked)).toEqual(["o1", "t1", "t2", "t3"]);
  });

  it("does not reserve a slot when the allowance is under 3", () => {
    expect(
      urls(selectPages([o(1), o(2), t(1)], { allowance: 2, held: none })),
    ).toEqual(["o1", "o2"]);
    expect(
      urls(selectPages([o(1), t(1), t(2)], { allowance: 2, held: none })),
    ).toEqual(["o1", "t1"]);
  });

  it("prefers third-party pages over forum pages", () => {
    expect(
      urls(selectPages([f(1), t(1), o(1)], { allowance: 3, held: none })),
    ).toEqual(["o1", "t1", "f1"]);
  });

  it("orders official pages by score", () => {
    expect(
      urls(
        selectPages([o(1, 0.1), o(2, 0.9), o(3, 0.5)], {
          allowance: 3,
          held: none,
        }),
      ),
    ).toEqual(["o2", "o3", "o1"]);
  });

  it.each([0, -2])("returns nothing for an allowance of %i", (allowance) => {
    expect(selectPages([o(1)], { allowance, held: none })).toEqual([]);
  });

  it("skips pages the run already holds, even under another form of the URL", () => {
    const held = new Set([hashUrl("https://docs.acme.com/o1")]);
    const picked = selectPages(
      [r("https://docs.acme.com/o1#intro", "official"), o(2)],
      { allowance: 2, held },
    );
    expect(urls(picked)).toEqual(["o2"]);
  });

  it("selects a page once when it appears twice or in two forms", () => {
    const picked = selectPages(
      [o(1), r("https://DOCS.acme.com/o1?utm_source=x", "official")],
      { allowance: 4, held: none },
    );
    expect(picked).toHaveLength(1);
  });

  it("skips images, archives, login pages and non-http URLs", () => {
    const skipped = [
      r("https://docs.acme.com/logo.png", "official"),
      r("https://docs.acme.com/export.zip", "official"),
      r("https://docs.acme.com/login", "official"),
      r("https://docs.acme.com/sign-in/", "official"),
      r("ftp://docs.acme.com/readme", "official"),
    ];
    expect(
      selectPages([...skipped, o(1)], { allowance: 6, held: none }),
    ).toEqual([o(1)]);
  });

  it("returns nothing for no results", () => {
    expect(selectPages([], { allowance: 4, held: none })).toEqual([]);
  });
});

describe("isFetchable", () => {
  it.each([
    ["https://docs.acme.com/guide/oauth", true],
    ["https://docs.acme.com/guide.pdf", true],
    ["https://docs.acme.com/loginhelp", true],
    ["https://docs.acme.com/photo.JPG", false],
    ["https://docs.acme.com/signup", false],
    ["https://docs.acme.com/register/", false],
    ["mailto:a@acme.com", false],
    ["not a url", false],
  ])("%s -> %s", (url, expected) => {
    expect(isFetchable(url)).toBe(expected);
  });
});

describe("MIN_PAGE_CHARS", () => {
  it("is 300", () => {
    expect(MIN_PAGE_CHARS).toBe(300);
  });
});
