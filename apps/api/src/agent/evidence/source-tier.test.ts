/**
 * File: source-tier.test.ts
 * Purpose: Tests source tiers: official, subdomains, lookalike domains, forums and bad input.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { isUnderDomain, normalizeDomain, sourceTier } from "./source-tier.js";

describe("sourceTier", () => {
  it("is official on the official domain and any subdomain", () => {
    expect(sourceTier("https://hubspot.com/docs", "hubspot.com")).toBe(
      "official",
    );
    expect(
      sourceTier("https://developers.hubspot.com/docs/api", "hubspot.com"),
    ).toBe("official");
    expect(sourceTier("https://www.hubspot.com/", "hubspot.com")).toBe(
      "official",
    );
  });

  it("ignores case, ports, a trailing dot and credentials in the URL", () => {
    expect(
      sourceTier("HTTPS://Developers.HubSpot.COM:8443/x", "hubspot.com"),
    ).toBe("official");
    expect(sourceTier("https://hubspot.com./docs", "hubspot.com")).toBe(
      "official",
    );
    expect(sourceTier("https://user:pw@hubspot.com/docs", "hubspot.com")).toBe(
      "official",
    );
  });

  it("accepts the official domain as a URL, with www, or in capitals", () => {
    for (const given of [
      "https://www.HubSpot.com/path",
      "WWW.hubspot.com",
      " hubspot.com. ",
    ]) {
      expect(sourceTier("https://developers.hubspot.com/a", given)).toBe(
        "official",
      );
    }
  });

  it("scopes official to a subdomain when the official domain is one", () => {
    expect(sourceTier("https://docs.example.com/a", "docs.example.com")).toBe(
      "official",
    );
    expect(sourceTier("https://blog.example.com/a", "docs.example.com")).toBe(
      "third_party",
    );
  });

  it("is not fooled by lookalike or suffix-trick domains", () => {
    for (const url of [
      "https://evilhubspot.com/docs",
      "https://hubspot.com.evil.net/docs",
      "https://hubspot.co/docs",
      "https://notmyhubspot.com",
      "https://evil.net/hubspot.com",
      "https://evil.net/?u=hubspot.com",
      "https://hubspot.com@evil.net/docs",
    ]) {
      expect(sourceTier(url, "hubspot.com")).toBe("third_party");
    }
  });

  it("is third_party for other sites", () => {
    expect(
      sourceTier("https://medium.com/@dev/oauth-guide", "hubspot.com"),
    ).toBe("third_party");
    expect(sourceTier("https://composio.dev/auth/hubspot", "hubspot.com")).toBe(
      "third_party",
    );
  });

  it("is forum for known Q&A and discussion sites", () => {
    expect(
      sourceTier("https://stackoverflow.com/questions/1", "hubspot.com"),
    ).toBe("forum");
    expect(sourceTier("https://www.reddit.com/r/hubspot", "hubspot.com")).toBe(
      "forum",
    );
    expect(
      sourceTier("https://news.ycombinator.com/item?id=1", "hubspot.com"),
    ).toBe("forum");
    expect(
      sourceTier("https://unix.stackexchange.com/q/1", "hubspot.com"),
    ).toBe("forum");
  });

  it("is forum for user-generated subdomains even on the official domain", () => {
    expect(
      sourceTier("https://community.hubspot.com/t5/x/y", "hubspot.com"),
    ).toBe("forum");
    expect(sourceTier("https://forum.example.org/t/1", "hubspot.com")).toBe(
      "forum",
    );
    expect(sourceTier("https://discuss.hubspot.com/x", "hubspot.com")).toBe(
      "forum",
    );
  });

  it("does not treat a plain two-label domain that starts with a forum word as a forum", () => {
    expect(sourceTier("https://forum.com/docs", "forum.com")).toBe("official");
    expect(sourceTier("https://community.io/docs", "hubspot.com")).toBe(
      "third_party",
    );
  });

  it("is official for a site that is itself a forum host when it is the official domain", () => {
    expect(sourceTier("https://www.reddit.com/dev/api", "reddit.com")).toBe(
      "official",
    );
    expect(
      sourceTier("https://stackoverflow.com/legal", "stackoverflow.com"),
    ).toBe("official");
  });

  it("falls back to third_party for unusable input", () => {
    expect(sourceTier("not a url", "hubspot.com")).toBe("third_party");
    expect(sourceTier("", "hubspot.com")).toBe("third_party");
    expect(sourceTier("ftp://hubspot.com/file", "hubspot.com")).toBe(
      "third_party",
    );
    expect(sourceTier("javascript:alert(1)", "hubspot.com")).toBe(
      "third_party",
    );
    expect(sourceTier("https://hubspot.com/docs", "")).toBe("third_party");
    expect(sourceTier("https://hubspot.com/docs", "   ")).toBe("third_party");
  });
});

describe("normalizeDomain", () => {
  it("returns a bare lowercase host", () => {
    expect(normalizeDomain("https://WWW.Example.com:8080/a/b?q=1#x")).toBe(
      "example.com",
    );
    expect(normalizeDomain("Example.COM/path")).toBe("example.com");
    expect(normalizeDomain("example.com.")).toBe("example.com");
  });

  it("returns an empty string for empty or unusable input", () => {
    expect(normalizeDomain("")).toBe("");
    expect(normalizeDomain("   ")).toBe("");
    expect(normalizeDomain("http://")).toBe("");
  });
});

describe("isUnderDomain", () => {
  it("matches the domain and subdomains on a dot boundary only", () => {
    expect(isUnderDomain("a.b.example.com", "example.com")).toBe(true);
    expect(isUnderDomain("example.com", "example.com")).toBe(true);
    expect(isUnderDomain("badexample.com", "example.com")).toBe(false);
    expect(isUnderDomain("example.com", "")).toBe(false);
  });
});
