/**
 * File: assemble-gaps.test.ts
 * Purpose: Tests that every gap in the drafts becomes an Uncertain unknown claim that says why, and that nothing unverified is shown as researched.
 * Exports: (none)
 * Used by: vitest
 */
import { GuideSchema } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import {
  allClaims,
  assembleInput,
  build,
} from "../../test-support/assemble-helpers.js";
import {
  OAUTH_URL,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import { drafted, withDrafts } from "../../test-support/guide-fixtures.js";
import { UNKNOWN_TEXT } from "./unknown-claim.js";

describe("assembleGuide: gaps", () => {
  it("fills a missing step effort with an unknown claim that says it was not found", () => {
    const effort = build().steps[0]?.effort;
    expect(effort).toEqual({
      id: "steps.0.effort",
      text: UNKNOWN_TEXT.not_found,
      label: "uncertain",
      sources: [],
    });
  });

  it("fills missing blocker parts and keeps a null contact null", () => {
    const blocker = build().blockers[0];
    expect(blocker?.cause).toMatchObject({
      id: "blockers.0.cause",
      label: "uncertain",
      sources: [],
    });
    expect(blocker?.fix?.text).toBe(UNKNOWN_TEXT.not_found);
    expect(blocker?.contact).toBeNull();
  });

  it("fills the milestone claims the model left null", () => {
    const guide = build();
    expect(guide.milestones.firstTest.wait).toMatchObject({
      id: "milestones.firstTest.wait",
      text: UNKNOWN_TEXT.not_found,
    });
    expect(guide.milestones.production.wait.label).toBe("uncertain");
  });

  it("keeps a claim whose quote was not found as Uncertain with no source", () => {
    const drafts = withDrafts({
      limits: drafted<"limits">({
        limits: [
          claim(
            OAUTH_URL,
            "Not a sentence from the page at all.",
            "Unlimited.",
          ),
        ],
      }),
    });
    expect(build({ drafts }).limits[0]).toEqual({
      id: "limits.0",
      text: "Unlimited.",
      label: "uncertain",
      sources: [],
    });
  });

  it("gives an empty requirements or limits section one unknown claim, so the guide stays valid", () => {
    const drafts = withDrafts({
      requirements: drafted<"requirements">({ requirements: [] }),
      limits: { status: "unknown" },
    });
    const guide = build({ drafts });
    expect(guide.requirements).toEqual([
      {
        id: "requirements.0",
        text: UNKNOWN_TEXT.not_found,
        label: "uncertain",
        sources: [],
      },
    ]);
    expect(guide.limits[0]?.text).toBe(UNKNOWN_TEXT.not_found);
    expect(GuideSchema.safeParse(guide).success).toBe(true);
  });

  it("says which reason applies: failed sections are unreadable, sections that never ran are out of time", () => {
    const guide = build({
      drafts: withDrafts({
        limits: { status: "failed", reason: "schema_failed" },
        requirements: { status: "failed", reason: "time_budget" },
      }),
    });
    expect(guide.limits[0]?.text).toBe(UNKNOWN_TEXT.unreadable);
    expect(guide.requirements[0]?.text).toBe(UNKNOWN_TEXT.time_budget);
  });

  it("builds a valid, wholly unknown guide from no drafts at all", () => {
    const guide = build({ drafts: {}, claims: [] });
    expect(GuideSchema.safeParse(guide).success).toBe(true);
    expect([
      guide.steps,
      guide.scopes,
      guide.blockers,
      guide.conflicts,
    ]).toEqual([[], [], [], []]);
    expect(guide.verdict).toMatchObject({
      nextStepId: null,
      topBlockerId: null,
    });
    expect(
      allClaims(guide).every(
        (c) => c.label === "uncertain" && c.sources.length === 0,
      ),
    ).toBe(true);
    expect(guide.verdict.summary.text).toBe(UNKNOWN_TEXT.time_budget);
  });

  it("never shows an unverified draft: with no verified claims every slot is unknown", () => {
    const guide = build({ claims: [] });
    expect(GuideSchema.safeParse(guide).success).toBe(true);
    expect(guide.steps[0]?.title).toBe("Create the app");
    expect(
      allClaims(guide).every(
        (c) => c.label === "uncertain" && c.sources.length === 0,
      ),
    ).toBe(true);
    expect(guide.steps[0]?.detail.text).toBe(UNKNOWN_TEXT.time_budget);
  });

  it("treats a verified claim as stale when a retry pass replaced its draft", () => {
    const newer = withDrafts({
      limits: drafted<"limits">({
        limits: [claim(OAUTH_URL, QUOTES.rate, "A different limit.")],
      }),
    });
    const guide = build({ drafts: newer, claims: assembleInput().claims });
    expect(guide.limits[0]).toMatchObject({
      text: UNKNOWN_TEXT.time_budget,
      sources: [],
    });
  });
});
