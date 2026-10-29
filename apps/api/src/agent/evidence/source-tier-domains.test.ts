/**
 * File: source-tier-domains.test.ts
 * Purpose: Tests tiering a URL against several official domains: any of them is official, look-alikes are not, forums still rank first.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { sourceTier } from "./source-tier.js";

describe("with several official domains", () => {
  const domains = ["slack.com", "slack.dev"];

  it("is official on any of them and on their subdomains", () => {
    expect(sourceTier("https://docs.slack.dev/oauth", domains)).toBe(
      "official",
    );
    expect(sourceTier("https://api.slack.com/authentication", domains)).toBe(
      "official",
    );
    expect(sourceTier("https://slack.dev/", domains)).toBe("official");
  });

  it("keeps other hosts third_party, including look-alikes", () => {
    expect(sourceTier("https://example.com/slack.dev", domains)).toBe(
      "third_party",
    );
    expect(sourceTier("https://evilslack.dev/docs", domains)).toBe(
      "third_party",
    );
  });

  it("still ranks a forum above official, on any official domain", () => {
    expect(sourceTier("https://community.slack.dev/t/1", domains)).toBe(
      "forum",
    );
    expect(sourceTier("https://www.reddit.com/r/slack", domains)).toBe("forum");
  });

  it("ignores an unusable entry and is third_party when none is usable", () => {
    expect(sourceTier("https://slack.dev/a", ["", "slack.dev"])).toBe(
      "official",
    );
    expect(sourceTier("https://slack.dev/a", [])).toBe("third_party");
    expect(sourceTier("https://slack.dev/a", ["", "  "])).toBe("third_party");
  });

  it("gives the same answer for one domain as for a list of one", () => {
    const url = "https://developers.hubspot.com/a";
    expect(sourceTier(url, ["hubspot.com"])).toBe(
      sourceTier(url, "hubspot.com"),
    );
  });
});
