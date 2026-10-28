/**
 * File: quote-match.test.ts
 * Purpose: Tests exact quote matching: normalisation, boundaries, short and empty input.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { MIN_QUOTE_LENGTH, matchQuote } from "./quote-match.js";

const page = `# Create an app

New apps are limited to 25 installs until the app is listed.
Call the authorize endpoint with a "client_id" and a redirect URI.`;

describe("matchQuote", () => {
  it("matches a quote that appears word for word", () => {
    expect(
      matchQuote("limited to 25 installs until the app is listed", page),
    ).toEqual({
      matched: true,
    });
  });

  it("ignores case and whitespace differences in the quote", () => {
    expect(matchQuote("  LIMITED   to 25\ninstalls  ", page)).toEqual({
      matched: true,
    });
  });

  it("ignores line breaks and extra spaces in the page", () => {
    const wrapped =
      "New apps are\n   limited to 25\tinstalls until the app is listed.";
    expect(matchQuote("limited to 25 installs", wrapped)).toEqual({
      matched: true,
    });
  });

  it("matches curly quotes in the quote against straight quotes in the page", () => {
    expect(
      matchQuote("with a \u201Cclient_id\u201D and a redirect", page),
    ).toEqual({
      matched: true,
    });
  });

  it("matches straight quotes in the quote against curly quotes in the page", () => {
    expect(
      matchQuote(
        "don't store the secret",
        "Please don\u2019t store the secret here.",
      ),
    ).toEqual({
      matched: true,
    });
  });

  it("matches en and em dashes against hyphens", () => {
    expect(
      matchQuote(
        "review takes 1-4 weeks to finish",
        "The review takes 1\u20134 weeks to finish.",
      ),
    ).toEqual({
      matched: true,
    });
  });

  it("does not match a quote that is not on the page", () => {
    expect(matchQuote("apps need a security assessment", page)).toEqual({
      matched: false,
      reason: "not_found",
    });
  });

  it("does not match a paraphrase or reordered words", () => {
    expect(
      matchQuote("installs are limited to 25 until listing", page).matched,
    ).toBe(false);
    expect(matchQuote("25 limited to installs until", page).matched).toBe(
      false,
    );
  });

  it("does not stitch a quote together from two places with an ellipsis", () => {
    expect(
      matchQuote("New apps are limited ... until the app is listed", page)
        .matched,
    ).toBe(false);
  });

  it("matches an ellipsis only when the page contains it too", () => {
    expect(
      matchQuote(
        "wait for review... then publish",
        "Please wait for review... then publish it.",
      ),
    ).toEqual({
      matched: true,
    });
  });

  it("does not cut a quote out of the middle of a number", () => {
    expect(
      matchQuote(
        "25 installs until the app",
        "limited to 125 installs until the app is listed",
      ),
    ).toEqual({
      matched: false,
      reason: "not_found",
    });
  });

  it("does not match the start of a longer word", () => {
    expect(
      matchQuote("create an app", "You can create an application here"),
    ).toEqual({
      matched: false,
      reason: "not_found",
    });
  });

  it("matches a later occurrence when an earlier one is cut out of a longer word", () => {
    expect(
      matchQuote(
        "25 installs per app",
        "125 installs per app, but 25 installs per app is the cap",
      ),
    ).toEqual({
      matched: true,
    });
  });

  it("lets a quote start or end at punctuation without a word boundary on that side", () => {
    expect(matchQuote('"client_id" and a redirect', page)).toEqual({
      matched: true,
    });
  });

  it("rejects an empty or whitespace-only quote, which would match every page", () => {
    expect(matchQuote("", page)).toEqual({
      matched: false,
      reason: "empty_quote",
    });
    expect(matchQuote(" \n\t ", page)).toEqual({
      matched: false,
      reason: "empty_quote",
    });
  });

  it("rejects a quote shorter than the minimum length", () => {
    const short = "a".repeat(MIN_QUOTE_LENGTH - 1);
    expect(matchQuote(short, `${short} and more`)).toEqual({
      matched: false,
      reason: "quote_too_short",
    });
    const exact = "a".repeat(MIN_QUOTE_LENGTH);
    expect(matchQuote(exact, `before ${exact} after`)).toEqual({
      matched: true,
    });
  });

  it("measures the minimum length after normalisation", () => {
    expect(matchQuote("   ok   fine   ", "ok fine").matched).toBe(false);
  });

  it("reports an empty page", () => {
    expect(matchQuote("limited to 25 installs", "")).toEqual({
      matched: false,
      reason: "empty_page",
    });
    expect(matchQuote("limited to 25 installs", "  \n ")).toEqual({
      matched: false,
      reason: "empty_page",
    });
  });

  it("is not fooled by regex characters in the quote", () => {
    expect(
      matchQuote(
        "scope (read|write) [all]*",
        "Use scope (read|write) [all]* for access",
      ),
    ).toEqual({
      matched: true,
    });
    expect(matchQuote("scope .* everything", "scope read everything")).toEqual({
      matched: false,
      reason: "not_found",
    });
  });
});
