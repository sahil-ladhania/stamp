/**
 * File: select-pages-coverage.test.ts
 * Purpose: Tests the PR 6b selection rules: the reserved slot goes only to a non-official page that names the app, and a retry with an unknown review gate reads gate-vocabulary pages first.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { SearchResult } from "../search-result.js";
import { relevance } from "./relevance.js";
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
const official = (n: number) =>
  page(`o${n}`, "OAuth scopes", ["scopes"], 0.9 - n / 100);
const elsewhere = (
  title: string,
  host = "forum.example.org",
  tier: SearchResult["tier"] = "forum",
) => page("t", title, ["approvalWait"], 0.4, tier, host);

describe("the reserved slot and the app's name", () => {
  const four = [official(1), official(2), official(3), official(4)];
  const pick = (extra: SearchResult[], appName?: string) =>
    selectPages([...four, ...extra], {
      allowance: 4,
      held: new Set(),
      product: null,
      ...(appName ? { appName } : {}),
    });

  it("refuses a non-official page that does not name the app, even when its title answers a topic", () => {
    expect(names(pick([elsewhere("OAuth app review time")], "Acme"))).toEqual([
      "o1",
      "o2",
      "o3",
      "o4",
    ]);
  });

  it("accepts one whose title, or address, names the app", () => {
    expect(
      names(pick([elsewhere("Acme OAuth app review time")], "Acme")),
    ).toContain("t");
    expect(
      names(
        pick(
          [
            elsewhere(
              "OAuth app review time",
              "blog.acme-fans.net",
              "third_party",
            ),
          ],
          "Acme",
        ),
      ),
    ).toContain("t");
  });

  it("matches the name ignoring case, spacing and punctuation", () => {
    expect(
      names(pick([elsewhere("The ACME-app review timeline")], "Acme app")),
    ).toContain("t");
  });

  it("is off when the app's name is not given, as before", () => {
    expect(names(pick([elsewhere("OAuth app review time")]))).toContain("t");
  });

  it("also accepts the product phrase", () => {
    const picked = selectPages([...four, elsewhere("Graph API review time")], {
      allowance: 4,
      held: new Set(),
      product: "Graph API",
      appName: "Microsoft",
    });
    expect(names(picked)).toContain("t");
  });
});

describe("a retry with an unknown review gate", () => {
  const generic = page(
    "guides/overview",
    "Getting started with OAuth",
    ["setup"],
    0.95,
  );
  const listing = page(
    "guides/marketplace-listing",
    "List your app on the marketplace",
    ["setup"],
    0.3,
  );

  it("adds a bonus for gate vocabulary in the title or path only when asked", () => {
    expect(
      relevance(listing, { product: null, gateFirst: true }),
    ).toBeGreaterThan(relevance(listing, { product: null }) + 2);
    expect(relevance(generic, { product: null, gateFirst: true })).toBeCloseTo(
      relevance(generic, { product: null }),
    );
  });

  it("reads the gate page before a better-scored generic page", () => {
    const first = selectPages([generic, listing], {
      allowance: 1,
      held: new Set(),
      product: null,
      gateFirst: true,
    });
    expect(names(first)).toEqual(["marketplace-listing"]);
    const normal = selectPages([generic, listing], {
      allowance: 1,
      held: new Set(),
      product: null,
    });
    expect(names(normal)).toEqual(["overview"]);
  });

  it.each([
    "review",
    "approval",
    "verification",
    "listing",
    "marketplace",
    "publish",
    "public-apps",
    "distribution",
    "submit",
  ])("recognises %s in a path as gate vocabulary", (word) => {
    const candidate = page(`docs/${word}`, "Overview", []);
    expect(
      relevance(candidate, { product: null, gateFirst: true }),
    ).toBeGreaterThan(relevance(candidate, { product: null }) + 2);
  });
});
