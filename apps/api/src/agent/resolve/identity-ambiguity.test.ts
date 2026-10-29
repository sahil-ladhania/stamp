/**
 * File: identity-ambiguity.test.ts
 * Purpose: Tests the two identity rules against the saved tuning searches and synthetic cases: a domain named after the app beats one that only mentions it in a title, and a close call between two brands ends in a "did you mean".
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  SCORE_WEIGHTS,
  rankCandidates,
  type ResolveHit,
} from "./candidates.js";
import { RESOLVE_TUNING, decideOfficial } from "./decide.js";
import { BASELINE_HITS, type BaselineSlug } from "./fixtures/baseline-hits.js";

const NAMES: Record<BaselineSlug, string> = {
  github: "GitHub",
  gmail: "Gmail",
  hubspot: "HubSpot",
  microsoft: "Microsoft",
  notion: "Notion",
  slack: "Slack",
};
const decide = (name: string, hits: ResolveHit[]) =>
  decideOfficial(rankCandidates(name, hits));
const h = (url: string, title: string): ResolveHit => ({ url, title });

describe("the six saved tuning searches", () => {
  it.each(Object.keys(NAMES) as BaselineSlug[])(
    "still resolve %s to one official domain, with no new 'did you mean'",
    (slug) => {
      expect(decide(NAMES[slug], BASELINE_HITS[slug]).kind).toBe("official");
    },
  );

  it("name the same domains as before", () => {
    const domain = (slug: BaselineSlug) => {
      const decision = decide(NAMES[slug], BASELINE_HITS[slug]);
      return decision.kind === "official" ? decision.domain : null;
    };
    expect([
      domain("github"),
      domain("gmail"),
      domain("hubspot"),
      domain("microsoft"),
      domain("notion"),
    ]).toEqual([
      "github.com",
      "google.com",
      "hubspot.com",
      "microsoft.com",
      "notion.com",
    ]);
  });
});

describe("a domain named after the app", () => {
  it("scores more than a domain that only mentions the app in a page title, other things equal", () => {
    const [named, mentioned] = rankCandidates("Acme", [
      h("https://www.acme.com/", "Home"),
      h("https://www.other.com/", "Acme overview"),
    ]);
    expect(named?.domain).toBe("acme.com");
    expect(
      (named?.score ?? 0) - (mentioned?.score ?? 0),
    ).toBeGreaterThanOrEqual(SCORE_WEIGHTS.exact - SCORE_WEIGHTS.title - 0.5);
  });

  it("wins over a title-only domain that has the better search positions and a docs host, so the app is not mistaken for a sibling product", () => {
    const hits = [
      h("https://developers.sealpen.io/docs/oauth", "Acme Sign API OAuth"),
      h("https://developers.sealpen.io/docs/apps", "Acme Sign app approval"),
      h("https://www.acme.com/developers", "Acme for developers"),
      h("https://developers.sealpen.io/api/auth", "Acme Sign authentication"),
    ];
    const decision = decide("Acme", hits);
    expect(decision).toEqual({ kind: "official", domain: "acme.com" });
  });
});

describe("a close call between two brands", () => {
  const candidate = (
    domain: string,
    score: number,
    match: "exact" | "title",
  ) => ({
    domain,
    label: domain.split(".")[0] ?? domain,
    match,
    score,
    hits: 1,
    docs: false,
  });

  it("starts with a margin of 90% of the leader", () => {
    expect(RESOLVE_TUNING.closeRatio).toBe(0.9);
  });

  it("ends in 'did you mean' with both when a title-only leader is within the margin of a named runner-up", () => {
    const decision = decideOfficial([
      candidate("sealpen.com", 4.08, "title"),
      candidate("acme.com", 3.97, "exact"),
    ]);
    expect(decision.kind).toBe("ambiguous");
    expect(
      decision.kind === "ambiguous" && decision.options.map((o) => o.domain),
    ).toEqual(["sealpen.com", "acme.com"]);
  });

  it("is also a close call when a named leader is within the margin of a title-only runner-up", () => {
    expect(
      decideOfficial([
        candidate("acme.com", 5, "exact"),
        candidate("sealpen.com", 4.5, "title"),
      ]).kind,
    ).toBe("ambiguous");
  });

  it("is not a close call below the margin, or between two domains of one brand", () => {
    expect(
      decideOfficial([
        candidate("acme.com", 5, "exact"),
        candidate("sealpen.com", 4.4, "title"),
      ]).kind,
    ).toBe("official");
    expect(
      decideOfficial([
        candidate("acme.com", 5, "exact"),
        { ...candidate("acme.dev", 4.9, "exact"), label: "acme" },
      ]).kind,
    ).toBe("official");
  });

  it("ignores a runner-up that does not match the name at all", () => {
    const none = {
      ...candidate("junk.com", 4.9, "title"),
      match: "none" as const,
    };
    expect(decideOfficial([candidate("acme.com", 5, "exact"), none]).kind).toBe(
      "official",
    );
  });
});
