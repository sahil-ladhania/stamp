/**
 * File: gate-judge.test.ts
 * Purpose: Tests the review gate and approval wait going through the support check: the sentences code writes, and a rejected gate or wait becoming unknown.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import { applyToGates, gateItems } from "./gate-judge.js";

describe("gateItems", () => {
  it("is the review gate and the approval wait, as sentences written in code from their values", () => {
    const items = gateItems(GATES_OUTPUT);
    expect(items.map((i) => i.id)).toEqual([
      "gates.reviewGate",
      "gates.approvalWait",
    ]);
    expect(items[0]?.claim).toMatch(/provider must review or approve/i);
    expect(items[1]?.claim).toMatch(/5 to 7 days/);
    expect(items[0]?.quote).toBe(GATES_OUTPUT.reviewGateEvidence.quote);
  });

  it("is nothing for a gate or wait that is unknown", () => {
    const unknown = {
      ...GATES_OUTPUT,
      reviewGateEvidence: null,
      reviewGate: "unknown" as const,
      approvalWaitEvidence: null,
      approvalWait: "unknown" as const,
    };
    expect(gateItems(unknown)).toEqual([]);
  });
});

describe("applyToGates", () => {
  it("makes a gate or wait the quote does not support unknown, and leaves the others", () => {
    const gates = applyToGates(
      GATES_OUTPUT,
      new Map([
        [
          "gates.reviewGate",
          { support: "unsupported" as const, aboutProduct: "yes" as const },
        ],
      ]),
    );
    expect(gates).toMatchObject({
      reviewGate: "unknown",
      reviewGateEvidence: null,
      approvalWait: "range",
    });
    const wait = applyToGates(
      GATES_OUTPUT,
      new Map([
        [
          "gates.approvalWait",
          { support: "partly" as const, aboutProduct: "yes" as const },
        ],
      ]),
    );
    expect(wait).toMatchObject({
      approvalWait: "unknown",
      approvalWaitMinDays: null,
      reviewGate: "required_to_scale",
    });
  });
});
