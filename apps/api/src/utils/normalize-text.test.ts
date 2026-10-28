/**
 * File: normalize-text.test.ts
 * Purpose: Tests text normalisation: whitespace, case, unicode quotes and dashes, invisible characters.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { normalizeText } from "./normalize-text.js";

describe("normalizeText", () => {
  it("collapses spaces, tabs and newlines to single spaces and trims", () => {
    expect(normalizeText("  Create   an\tapp\n\nin\r\nthe portal \n")).toBe(
      "create an app in the portal",
    );
  });

  it("treats non-breaking and ideographic spaces as whitespace", () => {
    expect(normalizeText("rate\u00A0limit\u3000applies")).toBe(
      "rate limit applies",
    );
  });

  it("ignores case", () => {
    expect(normalizeText("HubSpot OAuth")).toBe(normalizeText("hubspot oauth"));
  });

  it("folds curly single quotes and apostrophes to ASCII", () => {
    expect(normalizeText("don\u2019t use \u2018this\u2019")).toBe(
      "don't use 'this'",
    );
  });

  it("folds curly and angle double quotes to ASCII", () => {
    expect(normalizeText("\u201Cclient_id\u201D and \u00ABsecret\u00BB")).toBe(
      '"client_id" and "secret"',
    );
  });

  it("folds en dash, em dash, minus and non-breaking hyphen to a hyphen", () => {
    expect(normalizeText("1\u20137 days \u2014 or 2\u22123 \u2011 weeks")).toBe(
      "1-7 days - or 2-3 - weeks",
    );
  });

  it("expands the ellipsis character and compatibility forms (NFKC)", () => {
    expect(normalizeText("wait\u2026")).toBe("wait...");
    expect(normalizeText("\uFB01le \uFF21\uFF22")).toBe("file ab");
  });

  it("removes zero-width characters, soft hyphens and the byte-order mark", () => {
    expect(normalizeText("o\u200Bauth\u00ADscopes\uFEFF")).toBe("oauthscopes");
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    expect(normalizeText("")).toBe("");
    expect(normalizeText(" \n\t\u00A0 ")).toBe("");
  });

  it("is idempotent", () => {
    const samples = [
      "  A\u2019s \u201Ctest\u201D \u2014 OK\u2026 ",
      "\uFB01\u200Bnal\n\nline",
      "",
    ];
    for (const sample of samples) {
      expect(normalizeText(normalizeText(sample))).toBe(normalizeText(sample));
    }
  });

  it("never merges different words or reorders them", () => {
    expect(normalizeText("rate limit")).not.toBe(normalizeText("ratelimit"));
    expect(normalizeText("read write")).not.toBe(normalizeText("write read"));
  });

  it("keeps markdown and other punctuation as written", () => {
    expect(normalizeText("**Scopes**: `crm.read`")).toBe(
      "**scopes**: `crm.read`",
    );
  });
});
