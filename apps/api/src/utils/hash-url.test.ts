/**
 * File: hash-url.test.ts
 * Purpose: Tests URL normalisation and hashing: equal pages share a key, different pages do not.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { hashUrl, normalizeUrl } from "./hash-url.js";

describe("normalizeUrl", () => {
  it("lowercases the host, drops the fragment and the default port", () => {
    expect(normalizeUrl("HTTPS://Docs.Example.COM:443/OAuth#scopes")).toBe(
      "https://docs.example.com/OAuth",
    );
  });

  it("gives a bare origin and the same origin with a slash the same form", () => {
    expect(normalizeUrl("https://example.com")).toBe(
      normalizeUrl("https://example.com/"),
    );
  });

  it("keeps a non-default port", () => {
    expect(normalizeUrl("http://example.com:8080/a")).toBe(
      "http://example.com:8080/a",
    );
  });

  it("removes credentials and a trailing dot on the host", () => {
    expect(normalizeUrl("https://user:secret@example.com./docs")).toBe(
      "https://example.com/docs",
    );
  });

  it("sorts query parameters and drops tracking parameters only", () => {
    expect(
      normalizeUrl("https://example.com/p?b=2&utm_source=x&a=1&fbclid=z"),
    ).toBe("https://example.com/p?a=1&b=2");
  });

  it("keeps the path case and a trailing slash on a path (different resources)", () => {
    expect(normalizeUrl("https://example.com/Docs/")).toBe(
      "https://example.com/Docs/",
    );
    expect(normalizeUrl("https://example.com/Docs")).not.toBe(
      normalizeUrl("https://example.com/docs"),
    );
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUrl("  https://example.com/a \n")).toBe(
      "https://example.com/a",
    );
  });

  it("throws for invalid URLs and for schemes other than http and https", () => {
    expect(() => normalizeUrl("not a url")).toThrow(TypeError);
    expect(() => normalizeUrl("")).toThrow(TypeError);
    expect(() => normalizeUrl("ftp://example.com/file")).toThrow(
      /Only http and https/,
    );
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow(TypeError);
  });
});

describe("hashUrl", () => {
  it("returns a 64 character hex digest", () => {
    expect(hashUrl("https://example.com/a")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes equivalent URLs to the same key", () => {
    const keys = [
      "https://Example.com/a?x=1&y=2#top",
      "https://example.com:443/a?y=2&x=1&utm_campaign=z",
      "https://user@example.com/a?x=1&y=2",
    ].map(hashUrl);
    expect(new Set(keys).size).toBe(1);
  });

  it("hashes different pages to different keys", () => {
    expect(hashUrl("https://example.com/a")).not.toBe(
      hashUrl("https://example.com/b"),
    );
    expect(hashUrl("https://example.com/a?x=1")).not.toBe(
      hashUrl("https://example.com/a?x=2"),
    );
    expect(hashUrl("http://example.com/a")).not.toBe(
      hashUrl("https://example.com/a"),
    );
  });
});
