/**
 * File: official-domains.test.ts
 * Purpose: Tests picking every official domain of a company from the ranked search candidates, on the six saved baseline searches and on edge cases.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { rankCandidates, type ResolveHit } from "./candidates.js";
import { decideOfficial } from "./decide.js";
import { BASELINE_HITS, type BaselineSlug } from "./fixtures/baseline-hits.js";
import { MAX_OFFICIAL_DOMAINS, officialDomains } from "./official-domains.js";

const NAMES: Record<BaselineSlug, string> = {
  github: "GitHub",
  gmail: "Gmail",
  hubspot: "HubSpot",
  microsoft: "Microsoft",
  notion: "Notion",
  slack: "Slack",
};

/** The same steps the resolve stage takes: rank, decide, then list the official domains. */
function domainsFor(name: string, hits: ResolveHit[]): string[] {
  const candidates = rankCandidates(name, hits);
  const decision = decideOfficial(candidates);
  if (decision.kind !== "official") {
    throw new Error(`expected an official decision, got ${decision.kind}`);
  }
  return officialDomains(candidates, decision.domain);
}

const hits = (...urls: string[]): ResolveHit[] =>
  urls.map((url) => ({ url, title: "Docs" }));

describe("officialDomains on the saved baseline searches", () => {
  it("keeps both of Slack's documentation domains whichever one wins the ranking", () => {
    const found = domainsFor(NAMES.slack, BASELINE_HITS.slack);
    expect([...found].sort()).toEqual(["slack.com", "slack.dev"]);
    const decision = decideOfficial(
      rankCandidates(NAMES.slack, BASELINE_HITS.slack),
    );
    expect(found[0]).toBe(
      decision.kind === "official" ? decision.domain : undefined,
    );
  });

  it.each([
    ["github", ["github.com"]],
    ["gmail", ["google.com"]],
    ["hubspot", ["hubspot.com"]],
    ["microsoft", ["microsoft.com"]],
    ["notion", ["notion.com"]],
  ] as const)(
    "leaves %s with the one domain it had before",
    (slug, expected) => {
      expect(domainsFor(NAMES[slug], BASELINE_HITS[slug])).toEqual(expected);
    },
  );
});

describe("officialDomains rules", () => {
  it("adds a domain with the same brand label only when one of its hits looks like documentation", () => {
    const withDocs = hits(
      "https://www.acme.com/",
      "https://docs.acme.dev/oauth",
    );
    expect(domainsFor("Acme", withDocs)).toEqual(["acme.com", "acme.dev"]);
    const marketing = hits("https://www.acme.com/", "https://www.acme.dev/");
    expect(domainsFor("Acme", marketing)).toEqual(["acme.com"]);
  });

  it("never adds a domain with a different brand label", () => {
    const other = hits(
      "https://docs.acme.com/api",
      "https://docs.acmepartners.com/api",
    );
    expect(domainsFor("Acme", other)).toEqual(["acme.com"]);
  });

  it("never adds a shared hosting domain, even when its label is the app's name", () => {
    const hosted = hits(
      "https://docs.github.com/en/rest",
      "https://someone.github.io/docs/intro",
    );
    expect(domainsFor("GitHub", hosted)).toEqual(["github.com"]);
  });

  it("adds domains only when the winner matched the name by its own label", () => {
    const byTitle: ResolveHit[] = [
      { url: "https://developers.example.org/docs", title: "Zorbo API" },
      { url: "https://docs.example.net/zorbo", title: "Zorbo guide" },
    ];
    const candidates = rankCandidates("Zorbo", byTitle);
    expect(candidates[0]).toMatchObject({
      domain: "example.org",
      match: "title",
    });
    expect(candidates.map((c) => c.label)).toEqual(["example", "example"]);
    expect(officialDomains(candidates, "example.org")).toEqual(["example.org"]);
  });

  it("stops at the cap and keeps the best-scored domains", () => {
    const many = hits(
      "https://docs.acme.com/a",
      "https://docs.acme.dev/a",
      "https://docs.acme.io/a",
      "https://docs.acme.net/a",
    );
    const found = domainsFor("Acme", many);
    expect(found).toHaveLength(MAX_OFFICIAL_DOMAINS);
    expect(found[0]).toBe("acme.com");
  });

  it("returns the winner alone when no candidate has it", () => {
    expect(officialDomains([], "acme.com")).toEqual(["acme.com"]);
  });
});
