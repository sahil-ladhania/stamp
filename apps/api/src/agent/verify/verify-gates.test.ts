/**
 * File: verify-gates.test.ts
 * Purpose: Tests that gates evidence quotes are checked against their pages and unverified facts become unknown.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  OAUTH_URL,
  PAGE_INDEX,
  PAGES,
  QUOTES,
  REVIEW_TEXT,
  REVIEW_URL,
  claim,
} from "../../test-support/extract-fixtures.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import { indexPages } from "../extract/sanitize.js";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import type { SectionOutput } from "../extract/sections.js";
import { verifyGates } from "./verify-gates.js";

const verify = (over: Partial<SectionOutput<"gates">> = {}) =>
  verifyGates({ ...GATES_OUTPUT, ...over }, PAGE_INDEX);
const fake = (url = REVIEW_URL) =>
  claim(url, "This sentence is nowhere on the page at all.");

describe("verifyGates", () => {
  it("returns null when there are no gates", () => {
    expect(verifyGates(null, PAGE_INDEX)).toBeNull();
  });

  it("keeps every fact whose quote is on its page, and records a pass for each quote", () => {
    const result = verify();
    expect(result?.gates).toEqual(GATES_OUTPUT);
    expect(result?.checks.map((c) => [c.claimId, c.result])).toEqual([
      ["gates.authEvidence", "pass"],
      ["gates.reviewGateEvidence", "pass"],
      ["gates.approvalWaitEvidence", "pass"],
      ["gates.prerequisites.0", "pass"],
      ["gates.hiddenLimits.0", "pass"],
    ]);
  });

  it("records the page's content hash and URL on every check", () => {
    const check = verify()?.checks[0];
    expect(check?.method).toBe("quote_match");
    expect(check?.detail.contentHash).toBe(PAGES[0]?.contentHash);
    expect(check?.sourceUrl).toBe(OAUTH_URL);
  });

  it("makes the review gate unknown when its quote is not on the page, and records the failure", () => {
    const result = verify({ reviewGateEvidence: fake() });
    expect(result?.gates).toMatchObject({
      reviewGate: "unknown",
      reviewGateEvidence: null,
    });
    expect(
      result?.checks.find((c) => c.claimId === "gates.reviewGateEvidence"),
    ).toMatchObject({ result: "fail", detail: { reason: "not_found" } });
  });

  it("makes the approval wait unknown, and clears its days, when its quote is not on the page", () => {
    expect(verify({ approvalWaitEvidence: fake() })?.gates).toMatchObject({
      approvalWait: "unknown",
      approvalWaitMinDays: null,
      approvalWaitMaxDays: null,
      approvalWaitEvidence: null,
    });
  });

  it("makes the auth method unknown when its quote is not on the page", () => {
    expect(verify({ authEvidence: fake(OAUTH_URL) })?.gates).toMatchObject({
      authMethod: "unknown",
      authEvidence: null,
    });
  });

  it("drops a prerequisite, a hidden limit and an enterprise-plan claim whose quote is not on the page", () => {
    const real = claim(OAUTH_URL, QUOTES.cap);
    const result = verify({
      prerequisites: [real, fake()],
      hiddenLimits: [fake()],
      enterprisePlanEvidence: fake(),
    });
    expect(result?.gates.prerequisites).toEqual([real]);
    expect(result?.gates.hiddenLimits).toEqual([]);
    expect(result?.gates.enterprisePlanEvidence).toBeNull();
  });

  it("fails a quote that is too short to be evidence", () => {
    const result = verify({
      reviewGateEvidence: claim(REVIEW_URL, "Review"),
    });
    expect(
      result?.checks.find((c) => c.claimId === "gates.reviewGateEvidence")
        ?.detail.reason,
    ).toBe("quote_too_short");
    expect(result?.gates.reviewGate).toBe("unknown");
  });

  it("fails evidence on a page that is not held, naming the reason", () => {
    const result = verifyGates(
      {
        ...GATES_OUTPUT,
        authEvidence: claim("https://elsewhere.example.com/p", QUOTES.secret),
      },
      PAGE_INDEX,
    );
    expect(result?.gates.authMethod).toBe("unknown");
    expect(result?.checks[0]).toMatchObject({
      result: "fail",
      detail: { reason: "page_not_fetched" },
    });
    expect(result?.checks[0]?.detail.contentHash).toBeUndefined();
  });

  it("matches a quote despite case and spacing differences, as the evidence rule says", () => {
    const loose = claim(
      REVIEW_URL,
      "review   USUALLY takes 5 to 7 business days.",
    );
    expect(verify({ approvalWaitEvidence: loose })?.gates.approvalWait).toBe(
      "range",
    );
  });

  it("records no check for evidence that was already absent", () => {
    const result = verify({ enterprisePlanEvidence: null });
    expect(result?.checks.map((c) => c.claimId)).not.toContain(
      "gates.enterprisePlanEvidence",
    );
  });

  it("does not change the gates it was given", () => {
    const before = JSON.stringify(GATES_OUTPUT);
    verify({ reviewGateEvidence: fake() });
    expect(JSON.stringify(GATES_OUTPUT)).toBe(before);
  });

  describe("evidence from a page that is not official", () => {
    const BLOG = "https://blog.example.net/acme-review";
    const index = indexPages([
      ...PAGES,
      pageRecord(BLOG, "third_party", REVIEW_TEXT),
    ]);
    const run = (over: Partial<SectionOutput<"gates">>) =>
      verifyGates({ ...GATES_OUTPUT, ...over }, index);

    it("makes the review gate unknown, and records why, when only a third-party page says it", () => {
      const result = run({ reviewGateEvidence: claim(BLOG, QUOTES.approval) });
      expect(result?.gates.reviewGateEvidence).toBeNull();
      expect(
        result?.checks.find((c) => c.claimId === "gates.reviewGateEvidence"),
      ).toMatchObject({
        result: "fail",
        detail: { reason: "third_party_only" },
      });
    });

    it("makes the approval wait unknown the same way", () => {
      const result = run({ approvalWaitEvidence: claim(BLOG, QUOTES.review) });
      expect(result?.gates.approvalWaitEvidence).toBeNull();
      expect(result?.gates.approvalWait).toBe("unknown");
    });

    it("keeps the other facts, such as a prerequisite, that a third party gives", () => {
      const result = run({ prerequisites: [claim(BLOG, QUOTES.approval)] });
      expect(result?.gates.prerequisites).toHaveLength(1);
    });
  });
});
