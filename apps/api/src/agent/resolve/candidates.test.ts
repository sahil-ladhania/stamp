/**
 * File: candidates.test.ts
 * Purpose: Tests domain scoring: label matching, the denylist, docs hints, title matches and exact scores.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  SCORE_WEIGHTS,
  labelMatch,
  rankCandidates,
  type ResolveHit,
} from "./candidates.js";

const hit = (url: string, title = ""): ResolveHit => ({ url, title });

describe("labelMatch", () => {
  it.each([
    ["notion", "notion", "exact"],
    ["box", "box", "exact"],
    ["googlecalendar", "google", "partial"],
    ["notion", "notionapp", "partial"],
    ["smartsheet", "art", "none"],
    ["box", "boxes", "none"],
    ["notion", "linear", "none"],
    ["", "notion", "none"],
    ["notion", "", "none"],
  ])("matches name %j to label %j as %s", (name, label, expected) => {
    expect(labelMatch(name, label)).toBe(expected);
  });
});

describe("rankCandidates", () => {
  it("ranks the domain whose label equals the name first and groups subdomains together", () => {
    const ranked = rankCandidates("Notion", [
      hit("https://developers.notion.com/docs"),
      hit("https://www.notion.so/help"),
      hit("https://developers.notion.com/reference"),
    ]);
    expect(ranked.map((c) => c.domain)).toEqual(["notion.com", "notion.so"]);
    expect(ranked[0]).toMatchObject({
      label: "notion",
      match: "exact",
      hits: 2,
    });
  });

  it("scores a lone exact-label hit as 1 + the exact bonus", () => {
    expect(rankCandidates("Acme", [hit("https://acme.com/")])[0]?.score).toBe(
      1 + SCORE_WEIGHTS.exact,
    );
  });

  it("adds a docs bonus for a docs-looking host and caps it at 1", () => {
    expect(
      rankCandidates("Acme", [hit("https://docs.acme.com/a")])[0]?.score,
    ).toBe(1 + 0.5 + 3);
    const two = rankCandidates("Acme", [
      hit("https://docs.acme.com/a"),
      hit("https://developers.acme.com/b"),
    ]);
    expect(two[0]?.score).toBe(1 + 0.5 + 1 + 3);
    const three = rankCandidates("Acme", [
      hit("https://docs.acme.com/a"),
      hit("https://docs.acme.com/b"),
      hit("https://docs.acme.com/c"),
    ]);
    expect(three[0]?.score).toBe(1 + 0.5 + 1 / 3 + 1 + 3);
  });

  it("also treats a docs-looking path as a docs hint", () => {
    expect(
      rankCandidates("Acme", [hit("https://acme.com/developers/oauth")])[0]
        ?.score,
    ).toBe(1 + 0.5 + 3);
  });

  it("weights earlier search positions higher", () => {
    const ranked = rankCandidates("Zzz", [
      hit("https://one.example/a"),
      hit("https://two.example/b"),
    ]);
    expect(ranked.map((c) => c.domain)).toEqual(["one.example", "two.example"]);
    expect(ranked[0]?.score).toBe(1);
    expect(ranked[1]?.score).toBe(0.5);
  });

  it("matches a name that contains the brand label as a partial match", () => {
    const ranked = rankCandidates("Google Calendar", [
      hit("https://developers.google.com/calendar"),
    ]);
    expect(ranked[0]).toMatchObject({ domain: "google.com", match: "partial" });
  });

  it("matches on a page title when the domain label has nothing to do with the name", () => {
    const ranked = rankCandidates("QuickBooks", [
      hit("https://developer.intuit.com/app", "QuickBooks Online API docs"),
    ]);
    expect(ranked[0]).toMatchObject({ domain: "intuit.com", match: "title" });
  });

  it("does not match on a title for a name shorter than 4 letters", () => {
    expect(
      rankCandidates("Box", [
        hit("https://dropbox.example.org/", "Dropbox API"),
      ])[0]?.match,
    ).toBe("none");
  });

  it("gives no match to junk results for an unknown name", () => {
    const ranked = rankCandidates("Zzqx Unknownapp", [
      hit("https://example.org/a", "Example"),
      hit("https://other.net/b", "Other"),
    ]);
    expect(ranked.every((c) => c.match === "none")).toBe(true);
  });
});

describe("rankCandidates denylist", () => {
  const hits = [
    hit("https://github.com/slackapi"),
    hit("https://stackoverflow.com/q/1"),
    hit("https://slack.com/"),
  ];

  it("skips forums and code hosts for an app they are not named after", () => {
    expect(rankCandidates("Slack", hits).map((c) => c.domain)).toEqual([
      "slack.com",
    ]);
  });

  it("keeps a denied site when the app is that site", () => {
    expect(rankCandidates("GitHub", hits).map((c) => c.domain)).toContain(
      "github.com",
    );
    expect(
      rankCandidates("Medium", [hit("https://medium.com/")]).map(
        (c) => c.domain,
      ),
    ).toEqual(["medium.com"]);
  });

  it("skips an aggregator even when its subdomain looks like docs", () => {
    expect(
      rankCandidates("Zapier Clone", [hit("https://docs.zapier.com/x")]),
    ).toEqual([]);
  });
});

describe("rankCandidates input handling", () => {
  it("ignores URLs that are not http or https or cannot be parsed", () => {
    const ranked = rankCandidates("Acme", [
      hit("ftp://acme.com/x"),
      hit("not a url"),
      hit("https://acme.com/"),
    ]);
    expect(ranked.map((c) => c.domain)).toEqual(["acme.com"]);
  });

  it("returns nothing for no hits", () => {
    expect(rankCandidates("Acme", [])).toEqual([]);
  });

  it("uses the registrable domain of a two-part suffix", () => {
    expect(
      rankCandidates("Acme", [hit("https://docs.acme.co.uk/x")])[0],
    ).toMatchObject({ domain: "acme.co.uk", label: "acme" });
  });
});
