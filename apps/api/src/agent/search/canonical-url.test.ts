/**
 * File: canonical-url.test.ts
 * Purpose: Tests the key that makes locale and tracking variants of one page compare equal.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { canonicalKey, isEnglishVariant } from "./canonical-url.js";

describe("canonicalKey", () => {
  it.each([
    ["https://docs.github.com/en/apps/oauth", "docs.github.com/apps/oauth"],
    ["https://docs.github.com/apps/oauth", "docs.github.com/apps/oauth"],
    ["https://www.notion.com/es-es/help/x", "notion.com/help/x"],
    ["https://notion.com/zh-cn/help/x", "notion.com/help/x"],
    [
      "https://learn.example.com/pt-br/graph/auth",
      "learn.example.com/graph/auth",
    ],
    ["https://x.com/EN-US/a", "x.com/a"],
  ])("removes the locale segment: %s", (url, key) => {
    expect(canonicalKey(url)).toBe(key);
  });

  it("makes the three locales of one article one key", () => {
    const keys = [
      "https://www.notion.com/help/set-up-the-snowflake-mcp-for-notion",
      "https://www.notion.com/es-es/help/set-up-the-snowflake-mcp-for-notion",
      "https://www.notion.com/zh-cn/help/set-up-the-snowflake-mcp-for-notion",
    ].map(canonicalKey);
    expect(new Set(keys).size).toBe(1);
  });

  it("drops language and tracking parameters, the fragment, a trailing slash, www and case", () => {
    expect(
      canonicalKey(
        "https://WWW.Example.com/Docs/?hl=en&utm_source=x&gclid=1#top",
      ),
    ).toBe("example.com/docs");
    expect(canonicalKey("https://example.com/a?lang=fr&ref=nav")).toBe(
      "example.com/a",
    );
  });

  it("keeps parameters that pick a different page", () => {
    expect(canonicalKey("https://support.example.com/answer?id=3")).not.toBe(
      canonicalKey("https://support.example.com/answer?id=4"),
    );
  });

  it("does not treat an ordinary first segment as a locale", () => {
    expect(canonicalKey("https://example.com/api/v2/auth")).toBe(
      "example.com/api/v2/auth",
    );
    expect(canonicalKey("https://example.com/id/42")).toBe("example.com/id/42");
    expect(canonicalKey("https://example.com/english/x")).toBe(
      "example.com/english/x",
    );
  });

  it("never merges different hosts", () => {
    expect(canonicalKey("https://docs.github.com/en/a")).not.toBe(
      canonicalKey("https://developer.github.com/en/a"),
    );
  });

  it("gives back text that is not a URL unchanged", () => {
    expect(canonicalKey("not a url")).toBe("not a url");
  });
});

describe("isEnglishVariant", () => {
  it("is true with no locale segment or an English one, false for another language", () => {
    expect(isEnglishVariant("https://a.com/docs")).toBe(true);
    expect(isEnglishVariant("https://a.com/en-us/docs")).toBe(true);
    expect(isEnglishVariant("https://a.com/es-es/docs")).toBe(false);
  });
});
