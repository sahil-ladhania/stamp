/**
 * File: gate-facts.test.ts
 * Purpose: Tests the gates-to-facts rule: unknown for anything missing, unevidenced or invalid, and counts that never throw.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  OAUTH_URL,
  QUOTES,
  REVIEW_URL,
  claim,
} from "../../test-support/extract-fixtures.js";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import type { SectionOutput } from "../extract/sections.js";
import { scoreDifficulty } from "./difficulty.js";
import { UNKNOWN_FACTS, toGateFacts } from "./gate-facts.js";

type Gates = SectionOutput<"gates">;
const gates = (over: Partial<Gates> = {}): Gates => ({
  ...GATES_OUTPUT,
  ...over,
});

describe("toGateFacts", () => {
  it("reads a complete set of gates", () => {
    expect(toGateFacts(gates())).toEqual({
      reviewGate: "required_to_scale",
      approvalWait: { minDays: 5, maxDays: 7 },
      prerequisites: 1,
      hiddenLimits: 1,
      needsEnterprisePlan: false,
    });
  });

  it("gives unknown facts for missing gates, and they score as a lower bound with the wait counting 2", () => {
    expect(toGateFacts(null)).toEqual(UNKNOWN_FACTS);
    expect(scoreDifficulty(toGateFacts(null))).toMatchObject({
      reviewGate: 0,
      approvalWait: 2,
      prerequisites: 0,
      hiddenLimits: 0,
      total: 2,
    });
  });

  it("treats a review gate with no evidence as unknown", () => {
    expect(toGateFacts(gates({ reviewGateEvidence: null })).reviewGate).toBe(
      "unknown",
    );
  });

  it("treats a wait with no evidence as unknown, whatever days it carries", () => {
    expect(
      toGateFacts(gates({ approvalWaitEvidence: null })).approvalWait,
    ).toBe("unknown");
  });

  it("keeps a wait of none when it has evidence", () => {
    const none = gates({
      approvalWait: "none",
      approvalWaitMinDays: null,
      approvalWaitMaxDays: null,
    });
    expect(toGateFacts(none).approvalWait).toBe("none");
  });

  it.each([
    ["no minimum", null, 7],
    ["no maximum", 5, null],
    ["a minimum above the maximum", 9, 7],
  ])(
    "treats a range with %s as unknown instead of throwing",
    (_name, min, max) => {
      const facts = toGateFacts(
        gates({ approvalWaitMinDays: min, approvalWaitMaxDays: max }),
      );
      expect(facts.approvalWait).toBe("unknown");
      expect(() => scoreDifficulty(facts)).not.toThrow();
    },
  );

  it("treats a wait stated as unknown as unknown", () => {
    expect(toGateFacts(gates({ approvalWait: "unknown" })).approvalWait).toBe(
      "unknown",
    );
  });

  it("counts a prerequisite quoted twice once", () => {
    const twice = [
      claim(REVIEW_URL, QUOTES.approval, "One way."),
      claim(REVIEW_URL, QUOTES.approval, "Another way."),
    ];
    expect(toGateFacts(gates({ prerequisites: twice })).prerequisites).toBe(1);
    expect(
      toGateFacts(
        gates({ prerequisites: [...twice, claim(OAUTH_URL, QUOTES.secret)] }),
      ).prerequisites,
    ).toBe(2);
  });

  it("flags an enterprise plan only when its evidence is there", () => {
    expect(toGateFacts(gates()).needsEnterprisePlan).toBe(false);
    expect(
      toGateFacts(
        gates({ enterprisePlanEvidence: claim(REVIEW_URL, QUOTES.approval) }),
      ).needsEnterprisePlan,
    ).toBe(true);
  });
});
