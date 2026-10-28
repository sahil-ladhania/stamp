/**
 * File: passages-score.test.ts
 * Purpose: Tests keyword matching and scoring of passages: word starts, case, phrases and the per-keyword cap.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { compileKeywords, scoreText } from "./passages.js";

describe("scoreText and compileKeywords", () => {
  const score = (text: string, words: string[]) =>
    scoreText(text, compileKeywords(words));

  it("is 0 when no keyword appears", () => {
    expect(score("Nothing relevant here", ["scope", "oauth"])).toBe(0);
  });

  it("matches at the start of a word, ignoring case, so 'scope' finds 'Scopes'", () => {
    expect(score("OAuth Scopes", ["scope"])).toBe(3);
  });

  it("does not match in the middle of a word", () => {
    expect(score("mapping happens", ["app"])).toBe(0);
    expect(score("an app", ["app"])).toBe(3);
  });

  it("gives 2 per different keyword plus 1 per occurrence, at most 3 occurrences each", () => {
    expect(score("limit limit limit limit limit", ["limit"])).toBe(2 + 3);
    expect(score("scope and limit", ["scope", "limit"])).toBe(3 + 3);
  });

  it("matches phrases and keywords with regular-expression characters", () => {
    expect(score("Set the client id first", ["client id"])).toBe(3);
    expect(score("c++ and redirect_uri", ["c++", "redirect_uri"])).toBe(6);
  });
});
