/**
 * File: archetype.test.ts
 * Purpose: Tests the archetype priority order and the five library kinds of hard.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { classifyArchetype } from "./archetype.js";
import type { GateFacts } from "./difficulty.js";

const base: GateFacts = {
  reviewGate: "unknown",
  approvalWait: "unknown",
  prerequisites: 0,
  hiddenLimits: 0,
  needsEnterprisePlan: false,
};
const kind = (overrides: Partial<GateFacts>) =>
  classifyArchetype({ ...base, ...overrides });

describe("classifyArchetype", () => {
  it("classifies the five library apps", () => {
    expect(kind({ reviewGate: "none" })).toBe("instant");
    expect(kind({ reviewGate: "required_to_scale", hiddenLimits: 1 })).toBe(
      "hidden_limits",
    );
    expect(kind({ reviewGate: "security_assessment" })).toBe("review");
    expect(kind({ reviewGate: "partner_vetting" })).toBe("partner_gated");
    expect(
      kind({ reviewGate: "optional_listing", needsEnterprisePlan: true }),
    ).toBe("enterprise");
  });

  it("puts partner vetting above everything", () => {
    expect(
      kind({
        reviewGate: "partner_vetting",
        needsEnterprisePlan: true,
        hiddenLimits: 3,
      }),
    ).toBe("partner_gated");
  });

  it("puts an enterprise plan above review and hidden limits", () => {
    expect(
      kind({ reviewGate: "security_assessment", needsEnterprisePlan: true }),
    ).toBe("enterprise");
    expect(kind({ needsEnterprisePlan: true, hiddenLimits: 2 })).toBe(
      "enterprise",
    );
  });

  it("puts a security assessment above hidden limits", () => {
    expect(kind({ reviewGate: "security_assessment", hiddenLimits: 2 })).toBe(
      "review",
    );
  });

  it("puts hidden limits above a required listing and above an instant gate", () => {
    expect(kind({ reviewGate: "required_to_scale", hiddenLimits: 1 })).toBe(
      "hidden_limits",
    );
    expect(kind({ reviewGate: "none", hiddenLimits: 1 })).toBe("hidden_limits");
    expect(kind({ reviewGate: "unknown", hiddenLimits: 1 })).toBe(
      "hidden_limits",
    );
  });

  it("calls a required listing without limits a review", () => {
    expect(kind({ reviewGate: "required_to_scale" })).toBe("review");
  });

  it("calls an optional listing or no gate instant", () => {
    expect(kind({ reviewGate: "optional_listing" })).toBe("instant");
    expect(kind({ reviewGate: "none", prerequisites: 2 })).toBe("instant");
  });

  it("is unknown when nothing was verified", () => {
    expect(kind({})).toBe("unknown");
  });
});
