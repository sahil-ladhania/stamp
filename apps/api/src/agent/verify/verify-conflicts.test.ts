/**
 * File: verify-conflicts.test.ts
 * Purpose: Tests that code alone confirms a proposed conflict and states the preferred source and the reason.
 * Exports: (none)
 * Used by: vitest
 */
import { ConflictSchema } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import {
  BLOG_URL,
  index,
  official,
  proposal,
  proposed,
  viaBlog,
} from "../../test-support/conflict-fixtures.js";
import {
  OAUTH_URL,
  PAGES,
  QUOTES,
  REVIEW_URL,
  claim,
} from "../../test-support/extract-fixtures.js";
import { confirmConflicts, conflictKey } from "./verify-conflicts.js";

describe("confirmConflicts", () => {
  it("confirms a conflict whose quotes are real, whose sources and statements differ, and prefers the official source", () => {
    const { conflicts } = confirmConflicts(
      proposed(proposal({ sourceA: viaBlog, sourceB: official })),
      index,
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      id: "conflicts.0",
      topic: "Review time",
      preferredUrl: REVIEW_URL,
    });
    expect(conflicts[0]?.reason.text).toBe(
      "The sources disagree about Review time. The official source is preferred over the third-party source.",
    );
  });

  it("builds a conflict that passes the schema, with the reason as a Sourced claim citing both sides", () => {
    const { conflicts } = confirmConflicts(proposed(proposal()), index);
    expect(ConflictSchema.safeParse(conflicts[0]).success).toBe(true);
    expect(conflicts[0]?.reason).toMatchObject({
      id: "conflicts.0.reason",
      label: "sourced",
    });
    expect(conflicts[0]?.reason.sources.map((s) => s.url)).toEqual([
      REVIEW_URL,
      BLOG_URL,
    ]);
  });

  it("gives each source its page's tier and fetch time", () => {
    const { conflicts } = confirmConflicts(proposed(proposal()), index);
    expect(conflicts[0]?.sourceA).toMatchObject({
      url: REVIEW_URL,
      tier: "official",
      retrievedAt: PAGES[1]?.fetchedAt,
    });
    expect(conflicts[0]?.sourceB).toMatchObject({
      url: BLOG_URL,
      tier: "third_party",
    });
  });

  it("prefers a third-party source over a forum", () => {
    const viaForum = claim(
      "https://community.acme.com/t/9",
      "approval taking around three weeks.",
    );
    const { conflicts } = confirmConflicts(
      proposed(proposal({ sourceA: viaForum, sourceB: viaBlog })),
      index,
    );
    expect(conflicts[0]?.preferredUrl).toBe(BLOG_URL);
  });

  it("says the first listed source is shown first, with no recency to go on, when the tiers are equal", () => {
    const other = claim(
      OAUTH_URL,
      QUOTES.cap,
      "Each app is capped at 25 installs.",
    );
    const { conflicts } = confirmConflicts(
      proposed(proposal({ sourceA: official, sourceB: other })),
      index,
    );
    expect(conflicts[0]?.preferredUrl).toBe(REVIEW_URL);
    expect(conflicts[0]?.reason.text).toContain("no update date is available");
  });

  it("records a quote check for both sides of every proposal, with content hashes", () => {
    const { checks } = confirmConflicts(proposed(proposal()), index);
    expect(checks.map((c) => [c.claimId, c.result])).toEqual([
      ["conflicts.proposed.0.sourceA", "pass"],
      ["conflicts.proposed.0.sourceB", "pass"],
    ]);
    expect(checks[0]?.detail.contentHash).toBe(PAGES[1]?.contentHash);
  });

  it("returns the keys of the quotes that take part, so verify can downgrade the claims that use them", () => {
    const { conflictedKeys } = confirmConflicts(proposed(proposal()), index);
    expect(conflictedKeys.has(conflictKey(REVIEW_URL, QUOTES.review))).toBe(
      true,
    );
    expect(
      conflictedKeys.has(
        conflictKey(
          `${BLOG_URL}#x`,
          "APP approval takes about two weeks, not days.",
        ),
      ),
    ).toBe(true);
    expect(conflictedKeys.size).toBe(2);
  });
});
