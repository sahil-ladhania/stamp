/**
 * File: extraction-unknown.test.ts
 * Purpose: Tests that extraction schemas let the model answer "unknown" (null or empty), and the gates schema's shape and rules.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  AuthMethodSchema,
  ExtractBlockersOutputSchema,
  ExtractGatesOutputSchema,
  ExtractMilestonesOutputSchema,
  ExtractStepsOutputSchema,
  ExtractVerdictOutputSchema,
  ReviewGateOptions,
} from "./extraction.js";
import { reviewGatePoints } from "./scoring/difficulty.js";

const claim = {
  text: "Apps need review",
  quote: "Apps must be reviewed",
  url: "https://docs.acme.com/review",
};
const gates = {
  authMethod: "oauth",
  authEvidence: claim,
  reviewGate: "required_to_scale",
  reviewGateEvidence: claim,
  approvalWait: "range",
  approvalWaitMinDays: 3,
  approvalWaitMaxDays: 5,
  approvalWaitEvidence: claim,
  prerequisites: [claim],
  hiddenLimits: [],
  enterprisePlanEvidence: null,
};
const unknownGates = {
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

describe("unknown answers", () => {
  it("lets every milestone claim be null", () => {
    const unknown = {
      firstTestEffort: null,
      firstTestWait: null,
      productionEffort: null,
      productionWait: null,
    };
    expect(ExtractMilestonesOutputSchema.safeParse(unknown).success).toBe(true);
  });

  it("lets the verdict summary be null", () => {
    expect(
      ExtractVerdictOutputSchema.safeParse({
        summary: null,
        nextStepIndex: null,
        topBlockerIndex: null,
      }).success,
    ).toBe(true);
  });

  it("lets a step's effort be null but not its detail", () => {
    const step = { title: "Create an app", actor: "human", effort: null };
    expect(
      ExtractStepsOutputSchema.safeParse({
        steps: [{ ...step, detail: claim }],
      }).success,
    ).toBe(true);
    expect(
      ExtractStepsOutputSchema.safeParse({ steps: [{ ...step, detail: null }] })
        .success,
    ).toBe(false);
  });

  it("lets a blocker's cause, fix and contact be null but not its symptom", () => {
    const blocker = { symptom: claim, cause: null, fix: null, contact: null };
    expect(
      ExtractBlockersOutputSchema.safeParse({ blockers: [blocker] }).success,
    ).toBe(true);
    expect(
      ExtractBlockersOutputSchema.safeParse({
        blockers: [{ ...blocker, symptom: null }],
      }).success,
    ).toBe(false);
  });

  it("still requires the key to be present: null is an answer, silence is not", () => {
    expect(
      ExtractMilestonesOutputSchema.safeParse({ firstTestEffort: null })
        .success,
    ).toBe(false);
  });
});

describe("ExtractGatesOutputSchema", () => {
  it("accepts facts with their evidence", () => {
    expect(ExtractGatesOutputSchema.safeParse(gates).success).toBe(true);
  });

  it("accepts all unknown", () => {
    expect(ExtractGatesOutputSchema.safeParse(unknownGates).success).toBe(true);
  });

  it.each([
    [
      {
        approvalWait: "range",
        approvalWaitMinDays: null,
        approvalWaitMaxDays: 5,
      },
    ],
    [
      {
        approvalWait: "range",
        approvalWaitMinDays: 3,
        approvalWaitMaxDays: null,
      },
    ],
    [{ approvalWait: "range", approvalWaitMinDays: 9, approvalWaitMaxDays: 2 }],
  ])(
    "rejects an approval-wait range that is incomplete or backwards: %j",
    (change) => {
      expect(
        ExtractGatesOutputSchema.safeParse({ ...gates, ...change }).success,
      ).toBe(false);
    },
  );

  it("accepts a range of equal days", () => {
    expect(
      ExtractGatesOutputSchema.safeParse({
        ...gates,
        approvalWaitMinDays: 2,
        approvalWaitMaxDays: 2,
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown auth method, review gate or extra key", () => {
    expect(
      ExtractGatesOutputSchema.safeParse({ ...gates, authMethod: "saml" })
        .success,
    ).toBe(false);
    expect(
      ExtractGatesOutputSchema.safeParse({ ...gates, reviewGate: "strict" })
        .success,
    ).toBe(false);
    expect(
      ExtractGatesOutputSchema.safeParse({ ...gates, score: 4 }).success,
    ).toBe(false);
  });

  it("has no field for a score or a label: only code sets those", () => {
    const keys = Object.keys(ExtractGatesOutputSchema.shape);
    expect(keys).toContain("authMethod");
    expect(keys).not.toContain("score");
    expect(keys).not.toContain("label");
    expect(keys).not.toContain("difficulty");
  });
});

describe("gate options", () => {
  it("are exactly the gates the difficulty rule scores", () => {
    for (const option of ReviewGateOptions) {
      expect(reviewGatePoints(option)).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(ReviewGateOptions).size).toBe(6);
  });

  it("lists the four auth methods", () => {
    expect(AuthMethodSchema.options).toEqual([
      "oauth",
      "both",
      "api_key_only",
      "unknown",
    ]);
  });
});
