/**
 * File: classify.test.ts
 * Purpose: Tests how a Resolve answer is scored against the domains that count as correct.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { classify, domainMatches } from "./classify.js";

const official = (...domains: string[]) => ({
  decision: "official" as const,
  domains,
  options: [],
});
const asks = (...domains: string[]) => ({
  decision: "ambiguous" as const,
  domains: [],
  options: domains.map((domain) => ({ domain })),
});

describe("domainMatches", () => {
  it("matches the domain itself and its subdomains, not a longer domain or the platform above it", () => {
    expect(domainMatches("spotify.com", ["spotify.com"])).toBe(true);
    expect(domainMatches("pipedrive.readme.io", ["pipedrive.readme.io"])).toBe(
      true,
    );
    expect(domainMatches("developers.spotify.com", ["spotify.com"])).toBe(true);
    expect(domainMatches("readme.io", ["pipedrive.readme.io"])).toBe(false);
    expect(domainMatches("notspotify.com", ["spotify.com"])).toBe(false);
  });
});

describe("classify", () => {
  it("is ok when the official domain is expected", () => {
    expect(classify(official("spotify.com"), ["spotify.com"])).toBe("ok");
  });

  it("is ok when only a sibling official domain is expected", () => {
    expect(classify(official("slack.com", "slack.dev"), ["slack.dev"])).toBe(
      "ok",
    );
  });

  it("is wrong_domain for an official domain that is not expected", () => {
    expect(classify(official("youtube.com"), ["google.com"])).toBe(
      "wrong_domain",
    );
  });

  it("is ok_asks when the question offers an expected domain, ambiguous_wrong when it does not", () => {
    expect(classify(asks("monday.com", "mondayfit.com"), ["monday.com"])).toBe(
      "ok_asks",
    );
    expect(classify(asks("a.com", "b.com"), ["monday.com"])).toBe(
      "ambiguous_wrong",
    );
  });

  it("is no_docs for nothing and error for a failed search", () => {
    expect(
      classify({ decision: "none", domains: [], options: [] }, ["x.com"]),
    ).toBe("no_docs");
    expect(
      classify({ decision: "error", domains: [], options: [] }, ["x.com"]),
    ).toBe("error");
  });
});
