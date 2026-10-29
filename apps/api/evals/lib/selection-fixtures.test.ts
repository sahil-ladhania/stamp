/**
 * File: selection-fixtures.test.ts
 * Purpose: Tests page selection on the six real search-result lists saved from the first repetition of the clean baseline: it reads the golden pages and none of the avoided wrong-product pages.
 * Exports: (none)
 * Used by: vitest
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import type { SearchResult } from "../../src/agent/search-result.js";
import { selectPages } from "../../src/agent/fetch/select-pages.js";
import { goldenPageUrls, pageKey } from "../scoring/golden-recall.js";
import { loadGolden, type Golden } from "./golden.js";

type Row = [
  string,
  SearchResult["tier"],
  string | null,
  number | null,
  string[],
];

/** The saved lists are from before the identity stage; the product phrases are what it later finds for these two apps. */
const PRODUCT: Record<string, string | null> = {
  gmail: "Gmail API",
  microsoft: "Microsoft Graph",
};
const FIXTURE = JSON.parse(
  readFileSync(
    new URL("./fixtures/baseline-results.json", import.meta.url),
    "utf8",
  ),
) as Record<string, Row[]>;

let golden: Golden[];
beforeAll(async () => {
  golden = await loadGolden();
});

const resultsOf = (slug: string): SearchResult[] =>
  (FIXTURE[slug] ?? []).map(([url, tier, title, score, topics]) => ({
    url,
    tier,
    ...(title === null ? {} : { title }),
    ...(score === null ? {} : { score }),
    topics,
  }));

/** How many golden and avoided pages the selection picks for one app at the given allowance. */
function picks(
  slug: string,
  allowance: number,
): { golden: number; wrong: number } {
  const g = golden.find((entry) => entry.slug === slug) as Golden;
  const aliases = new Map(
    (g.docs.urlAliases ?? []).map((a) => [
      pageKey(a.seenAs),
      pageKey(a.golden),
    ]),
  );
  const wanted = new Set(goldenPageUrls(g).map(pageKey));
  const picked = selectPages(resultsOf(slug), {
    allowance,
    held: new Set(),
    product: PRODUCT[slug] ?? null,
  });
  return {
    golden: picked.filter((p) =>
      wanted.has(aliases.get(pageKey(p.url)) ?? pageKey(p.url)),
    ).length,
    wrong: picked.filter((p) =>
      g.avoidProducts.some((a) =>
        a.hostPathHints.some((hint) =>
          p.url.toLowerCase().includes(hint.toLowerCase()),
        ),
      ),
    ).length,
  };
}
const SLUGS = ["github", "gmail", "hubspot", "microsoft", "notion", "slack"];
const total = (allowance: number, key: "golden" | "wrong"): number =>
  SLUGS.reduce((sum, slug) => sum + picks(slug, allowance)[key], 0);

describe("selection on the six saved result lists", () => {
  it("reads no avoided wrong-product page on the first pass of any app", () => {
    for (const slug of SLUGS) {
      expect(picks(slug, 4).wrong, slug).toBe(0);
    }
  });

  it("reads a golden page on the first pass of every app whose list holds one it can reach, where the baseline read about two in all", () => {
    expect(total(4, "golden")).toBeGreaterThanOrEqual(4);
    for (const slug of ["github", "gmail", "hubspot", "slack"]) {
      expect(picks(slug, 4).golden, slug).toBeGreaterThanOrEqual(1);
    }
  });

  it("reads more golden pages with the six-page allowance, and never more than the lists hold", () => {
    expect(total(6, "golden")).toBeGreaterThanOrEqual(6);
    expect(total(6, "golden")).toBeLessThanOrEqual(13);
  });

  it("cuts the avoided pages read across the six lists to at most the 3 that show up in the second pass, from at least 5 in the baseline", () => {
    expect(total(6, "wrong")).toBeLessThanOrEqual(3);
  });
});
