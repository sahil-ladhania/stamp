/**
 * File: sanitize-gates.test.ts
 * Purpose: Tests that a gates fact without a fetched-page claim as evidence becomes unknown, and that hasContent spots empty sections.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { SectionOutput } from "./sections.js";
import {
  OAUTH_URL,
  PAGE_INDEX,
  QUOTES,
  REVIEW_URL,
  claim,
} from "../../test-support/extract-fixtures.js";
import { hasContent } from "./has-content.js";
import { sanitizeSection } from "./sanitize.js";

const ok = claim(OAUTH_URL, QUOTES.secret);
const approval = claim(OAUTH_URL, QUOTES.approval);
const wait = claim(REVIEW_URL, QUOTES.review);
const stray = claim("https://evil.example.com/p", "Anything at all here");
const unknown: SectionOutput<"gates"> = {
  authMethod: "unknown",
  authEvidence: null,
  reviewGate: "unknown",
  reviewGateEvidence: null,
  approvalWait: "unknown",
  approvalWaitMinDays: null,
  approvalWaitMaxDays: null,
  approvalWaitEvidence: null,
  prerequisites: [],
  hiddenLimits: [],
  enterprisePlanEvidence: null,
};
const full: SectionOutput<"gates"> = {
  authMethod: "oauth",
  authEvidence: ok,
  reviewGate: "required_to_scale",
  reviewGateEvidence: approval,
  approvalWait: "range",
  approvalWaitMinDays: 5,
  approvalWaitMaxDays: 7,
  approvalWaitEvidence: wait,
  prerequisites: [ok],
  hiddenLimits: [ok],
  enterprisePlanEvidence: ok,
};
const clean = (gates: SectionOutput<"gates">) =>
  sanitizeSection("gates", gates, { pages: PAGE_INDEX });

describe("gates with their evidence on fetched pages", () => {
  it("are kept as they are, with page URLs", () => {
    expect(clean(full)).toEqual({ output: full, dropped: 0 });
  });
});

describe("gates whose evidence is not a fetched page", () => {
  it("make the auth method unknown", () => {
    const { output, dropped } = clean({
      ...full,
      authMethod: "api_key_only",
      authEvidence: stray,
    });
    expect(output).toMatchObject({ authMethod: "unknown", authEvidence: null });
    expect(dropped).toBe(1);
  });

  it("make the review gate unknown", () => {
    expect(clean({ ...full, reviewGateEvidence: stray }).output).toMatchObject({
      reviewGate: "unknown",
      reviewGateEvidence: null,
    });
  });

  it("make the approval wait unknown and clear its days", () => {
    expect(
      clean({ ...full, approvalWaitEvidence: stray }).output,
    ).toMatchObject({
      approvalWait: "unknown",
      approvalWaitMinDays: null,
      approvalWaitMaxDays: null,
      approvalWaitEvidence: null,
    });
  });

  it("drop an unfetched prerequisite, hidden limit and enterprise-plan claim", () => {
    const { output, dropped } = clean({
      ...full,
      prerequisites: [ok, stray],
      hiddenLimits: [stray],
      enterprisePlanEvidence: stray,
    });
    expect(output.prerequisites).toEqual([ok]);
    expect(output.hiddenLimits).toEqual([]);
    expect(output.enterprisePlanEvidence).toBeNull();
    expect(dropped).toBe(3);
  });

  it("do not make a fact unknown just because its evidence is missing from a fact that was already unknown", () => {
    expect(clean(unknown)).toEqual({ output: unknown, dropped: 0 });
  });
});

describe("gates facts that claim a state with no evidence at all", () => {
  it("become unknown, because nothing backs them", () => {
    const { output } = clean({
      ...full,
      authEvidence: null,
      reviewGateEvidence: null,
      approvalWaitEvidence: null,
    });
    expect(output).toMatchObject({
      authMethod: "unknown",
      reviewGate: "unknown",
      approvalWait: "unknown",
    });
  });

  it("clear the days of an approval wait that is not a range", () => {
    expect(clean({ ...full, approvalWait: "none" }).output).toMatchObject({
      approvalWait: "none",
      approvalWaitMinDays: null,
      approvalWaitMaxDays: null,
    });
  });
});

describe("hasContent", () => {
  it("is false for an empty list in every list section", () => {
    expect(hasContent("steps", { steps: [] })).toBe(false);
    expect(hasContent("scopes", { scopes: [] })).toBe(false);
    expect(hasContent("requirements", { requirements: [] })).toBe(false);
    expect(hasContent("limits", { limits: [] })).toBe(false);
    expect(hasContent("blockers", { blockers: [] })).toBe(false);
    expect(hasContent("conflicts", { conflicts: [] })).toBe(false);
  });

  it("is true for a list with an item", () => {
    expect(hasContent("requirements", { requirements: [ok] })).toBe(true);
    expect(hasContent("scopes", { scopes: [{ name: "x", reason: ok }] })).toBe(
      true,
    );
  });

  it("is true for milestones only when one claim is present", () => {
    const none = {
      firstTestEffort: null,
      firstTestWait: null,
      productionEffort: null,
      productionWait: null,
    };
    expect(hasContent("milestones", none)).toBe(false);
    expect(hasContent("milestones", { ...none, productionWait: wait })).toBe(
      true,
    );
  });

  it("is true for a verdict only with a summary", () => {
    expect(
      hasContent("verdict", {
        summary: null,
        nextStepIndex: 0,
        topBlockerIndex: 0,
      }),
    ).toBe(false);
    expect(
      hasContent("verdict", {
        summary: ok,
        nextStepIndex: null,
        topBlockerIndex: null,
      }),
    ).toBe(true);
  });

  it("is true for gates only when something is known", () => {
    expect(hasContent("gates", unknown)).toBe(false);
    expect(hasContent("gates", { ...unknown, hiddenLimits: [ok] })).toBe(true);
    expect(
      hasContent("gates", { ...unknown, enterprisePlanEvidence: ok }),
    ).toBe(true);
    expect(hasContent("gates", { ...unknown, reviewGate: "none" })).toBe(true);
  });
});
