/**
 * File: conflicts.test.ts
 * Purpose: Tests conflict confirmation and the official, newer, first-listed preference order.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { resolveConflict, type ConflictSide } from "./conflicts.js";

function side(
  overrides: Partial<ConflictSide> & { text?: string; url?: string } = {},
): ConflictSide {
  const { text, url, ...rest } = overrides;
  return {
    draft: {
      text: text ?? "The callback path is /api/v3/.",
      quote: "callback path is /api/v3/",
      url: url ?? "https://docs.example.com/a",
    },
    tier: "official",
    quoteMatched: true,
    ...rest,
  };
}

const other = {
  text: "The callback path is /api/v3.1/.",
  url: "https://docs.example.com/b",
};

describe("resolveConflict: dismissed", () => {
  it("is dismissed when either quote is not on its page", () => {
    expect(
      resolveConflict({
        topic: "t",
        a: side({ quoteMatched: false }),
        b: side(other),
      }),
    ).toEqual({
      confirmed: false,
      dismissedBecause: "quote_not_found",
    });
    expect(
      resolveConflict({
        topic: "t",
        a: side(),
        b: side({ ...other, quoteMatched: false }),
      }),
    ).toEqual({
      confirmed: false,
      dismissedBecause: "quote_not_found",
    });
  });

  it("is dismissed when both claims come from the same page", () => {
    const verdict = resolveConflict({
      topic: "t",
      a: side(),
      b: side({
        text: "Something else.",
        url: "https://DOCS.example.com:443/a#frag",
      }),
    });
    expect(verdict).toEqual({
      confirmed: false,
      dismissedBecause: "same_source",
    });
  });

  it("is dismissed when the two statements are the same after normalisation", () => {
    const verdict = resolveConflict({
      topic: "t",
      a: side({ text: "The  Callback path is /api/v3/." }),
      b: side({
        text: "the callback PATH is /api/v3/.",
        url: "https://docs.example.com/b",
      }),
    });
    expect(verdict).toEqual({
      confirmed: false,
      dismissedBecause: "same_statement",
    });
  });

  it("falls back to comparing raw text for URLs that cannot be normalised", () => {
    const verdict = resolveConflict({
      topic: "t",
      a: side({ url: "ftp://files.example.com/x" }),
      b: side({ ...other, url: "ftp://files.example.com/x" }),
    });
    expect(verdict).toEqual({
      confirmed: false,
      dismissedBecause: "same_source",
    });
  });
});

describe("resolveConflict: preference", () => {
  it("prefers an official source over a third-party one, whichever side it is on", () => {
    const official = side();
    const third = side({ ...other, tier: "third_party" });
    const ab = resolveConflict({ topic: "t", a: official, b: third });
    const ba = resolveConflict({ topic: "t", a: third, b: official });
    expect(ab).toMatchObject({
      confirmed: true,
      preferred: "a",
      basis: "tier",
    });
    expect(ba).toMatchObject({
      confirmed: true,
      preferred: "b",
      basis: "tier",
    });
    if (ab.confirmed)
      expect(ab.reason).toBe(
        "The official source is preferred over the third-party source.",
      );
  });

  it("ranks third-party above forum and official above forum", () => {
    const forum = side({ ...other, tier: "forum" });
    expect(
      resolveConflict({
        topic: "t",
        a: forum,
        b: side({ tier: "third_party" }),
      }),
    ).toMatchObject({
      preferred: "b",
      basis: "tier",
    });
    expect(resolveConflict({ topic: "t", a: forum, b: side() })).toMatchObject({
      preferred: "b",
    });
  });

  it("lets a better tier win even when the other source is newer", () => {
    const verdict = resolveConflict({
      topic: "t",
      a: side({
        ...other,
        tier: "third_party",
        updatedAt: new Date("2026-06-01"),
      }),
      b: side({ updatedAt: new Date("2020-01-01") }),
    });
    expect(verdict).toMatchObject({ preferred: "b", basis: "tier" });
  });

  it("prefers the newer page when both sources have the same tier and dates are known", () => {
    const older = side({ updatedAt: new Date("2024-01-01") });
    const newer = side({ ...other, updatedAt: new Date("2026-03-01") });
    expect(resolveConflict({ topic: "t", a: older, b: newer })).toMatchObject({
      confirmed: true,
      preferred: "b",
      basis: "newer",
    });
    expect(resolveConflict({ topic: "t", a: newer, b: older })).toMatchObject({
      preferred: "a",
      basis: "newer",
    });
  });

  it("falls back to the first listed source when tiers match and no date decides, and says so", () => {
    for (const [a, b] of [
      [side(), side(other)],
      [side({ updatedAt: new Date("2026-01-01") }), side(other)],
      [
        side({ updatedAt: new Date("2026-01-01") }),
        side({ ...other, updatedAt: new Date("2026-01-01") }),
      ],
    ]) {
      const verdict = resolveConflict({
        topic: "t",
        a: a as ConflictSide,
        b: b as ConflictSide,
      });
      expect(verdict).toMatchObject({
        confirmed: true,
        preferred: "a",
        basis: "first_listed",
      });
      if (verdict.confirmed)
        expect(verdict.reason).toContain("no update date is available");
    }
  });

  it("writes reasons without em dashes", () => {
    const verdict = resolveConflict({ topic: "t", a: side(), b: side(other) });
    if (!verdict.confirmed) throw new Error("expected a confirmed conflict");
    expect(verdict.reason).not.toMatch(/\u2014/);
  });
});
