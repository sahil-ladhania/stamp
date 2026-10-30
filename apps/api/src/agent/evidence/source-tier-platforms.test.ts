/**
 * File: source-tier-platforms.test.ts
 * Purpose: Tests the two tiering rules added after the fresh holdout: a subdomain label that contains "community" or "forum" is a forum, and a docs host on a known documentation platform named after the app is official.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { sourceTier } from "./source-tier.js";

describe("forum labels", () => {
  it.each([
    "https://devcommunity.acme.com/t/review-process/4355",
    "https://communities.acme.com/t/1",
    "https://acme-community.acme.com/t/1",
    "https://devforum.acme.com/t/1",
    "https://forums.acme.com/t/1",
    "https://community.acme.com/t/1",
    "https://developercommunity.acme.com/t/1",
  ])("tiers %s as a forum, even on the official domain", (url) => {
    expect(sourceTier(url, "acme.com")).toBe("forum");
  });

  it("keeps the labels it already knew", () => {
    expect(sourceTier("https://discuss.acme.com/t/1", "acme.com")).toBe(
      "forum",
    );
    expect(sourceTier("https://answers.acme.com/q/1", "acme.com")).toBe(
      "forum",
    );
  });

  it("does not tier an ordinary documentation host as a forum", () => {
    for (const host of [
      "docs",
      "developers",
      "developer",
      "api",
      "support",
      "help",
      "information",
      "platform",
    ]) {
      expect(sourceTier(`https://${host}.acme.com/x`, "acme.com")).toBe(
        "official",
      );
    }
  });

  it("looks at the subdomain label only: a two-label domain or a path is not a forum", () => {
    expect(sourceTier("https://acmeforum.com/docs", "acme.com")).toBe(
      "third_party",
    );
    expect(
      sourceTier("https://docs.acme.com/community/guide", "acme.com"),
    ).toBe("official");
  });

  it("still lets an official domain that is itself a forum host stay official", () => {
    expect(
      sourceTier("https://community.example.org/docs", "community.example.org"),
    ).toBe("official");
    expect(sourceTier("https://forum.com/docs", "forum.com")).toBe("official");
  });
});

describe("a documentation platform host named after the app", () => {
  const tier = (url: string, appName?: string) =>
    sourceTier(url, "acme.com", appName === undefined ? {} : { appName });

  it.each([
    "https://acme.readme.io/docs/oauth",
    "https://acme.gitbook.io/guide",
    "https://acme.mintlify.app/api",
    "https://docs.acme.readme.io/x",
  ])("is official for %s when the app is Acme", (url) => {
    expect(tier(url, "Acme")).toBe("official");
  });

  it("matches the name ignoring case, spacing and punctuation", () => {
    expect(tier("https://acme-app.readme.io/docs", "Acme App")).toBe(
      "official",
    );
    expect(tier("https://ACME.readme.io/docs", "acme")).toBe("official");
  });

  it("is third party for another app's name, a look-alike or a host that merely contains the platform", () => {
    expect(tier("https://other.readme.io/docs", "Acme")).toBe("third_party");
    expect(tier("https://evilacme.readme.io/docs", "Acme")).toBe("third_party");
    expect(tier("https://acme.readme.io.evil.com/docs", "Acme")).toBe(
      "third_party",
    );
    expect(tier("https://readme.io/acme", "Acme")).toBe("third_party");
  });

  it("is third party for any other platform-like host, and when the app's name is not given", () => {
    expect(tier("https://acme.example.io/docs", "Acme")).toBe("third_party");
    expect(tier("https://acme.readme.io/docs")).toBe("third_party");
  });

  it("is a forum when the label says so, which beats the platform rule", () => {
    expect(tier("https://community.acme.readme.io/t/1", "Acme")).toBe("forum");
  });
});
