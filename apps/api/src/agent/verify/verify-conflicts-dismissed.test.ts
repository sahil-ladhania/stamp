/**
 * File: verify-conflicts-dismissed.test.ts
 * Purpose: Tests the conflicts code dismisses (bad quote, same page, same statement, unfetched page), the numbering that skips them and the empty cases.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  BLOG_URL,
  index,
  proposal,
  proposed,
} from "../../test-support/conflict-fixtures.js";
import {
  QUOTES,
  REVIEW_URL,
  claim,
} from "../../test-support/extract-fixtures.js";
import { confirmConflicts } from "./verify-conflicts.js";

describe("confirmConflicts: dismissed and empty", () => {
  it("dismisses a conflict when a quote is not on its page", () => {
    const fake = claim(BLOG_URL, "Approval is instant for everyone, always.");
    expect(
      confirmConflicts(proposed(proposal({ sourceB: fake })), index).conflicts,
    ).toEqual([]);
  });

  it("dismisses a conflict whose two sides are the same page", () => {
    const same = claim(
      REVIEW_URL,
      QUOTES.approval,
      "Apps over 25 installs need approval.",
    );
    expect(
      confirmConflicts(proposed(proposal({ sourceB: same })), index).conflicts,
    ).toEqual([]);
  });

  it("dismisses a conflict whose two sides say the same thing", () => {
    const echo = claim(
      BLOG_URL,
      "app approval takes about two weeks, not days.",
      "Review takes 5 to 7 business days.",
    );
    expect(
      confirmConflicts(proposed(proposal({ sourceB: echo })), index).conflicts,
    ).toEqual([]);
  });

  it("dismisses a conflict that cites a page that was not fetched", () => {
    const stray = claim(
      "https://elsewhere.example.com/p",
      "This page was never fetched at all.",
    );
    expect(
      confirmConflicts(proposed(proposal({ sourceB: stray })), index).conflicts,
    ).toEqual([]);
  });

  it("numbers confirmed conflicts in order, without a gap for a dismissed one", () => {
    const bad = proposal({
      sourceB: claim(BLOG_URL, "A quote that is not on the page anywhere."),
    });
    const { conflicts } = confirmConflicts(
      proposed(bad, proposal(), proposal({ topic: "Second" })),
      index,
    );
    expect(conflicts.map((c) => c.id)).toEqual(["conflicts.0", "conflicts.1"]);
  });

  it("returns nothing when no conflicts were proposed, or the section was not drafted", () => {
    expect(confirmConflicts({}, index)).toMatchObject({
      conflicts: [],
      checks: [],
    });
    expect(
      confirmConflicts({ conflicts: { status: "unknown" } }, index).conflicts,
    ).toEqual([]);
    expect(confirmConflicts(proposed(), index).conflicts).toEqual([]);
  });
});
