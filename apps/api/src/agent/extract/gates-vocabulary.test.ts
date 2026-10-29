/**
 * File: gates-vocabulary.test.ts
 * Purpose: Tests that a review gate other than none or unknown needs a review, approval, assessment, listing or vetting word in its quote, or it becomes unknown.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  OAUTH_URL,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import { withoutUnevidencedFacts } from "./gates-normalize.js";
import type { SectionOutput } from "./sections.js";

const gate = (
  reviewGate: SectionOutput<"gates">["reviewGate"],
  quote: string,
): SectionOutput<"gates"> =>
  withoutUnevidencedFacts({
    ...GATES_OUTPUT,
    reviewGate,
    reviewGateEvidence: claim(OAUTH_URL, quote),
  });

describe("review gate vocabulary", () => {
  it.each([
    ["required_to_scale", QUOTES.approval],
    [
      "security_assessment",
      "Apps that read mail need an annual security assessment.",
    ],
    [
      "optional_listing",
      "Listing your app in the marketplace requires a review.",
    ],
    [
      "partner_vetting",
      "Developers must be vetted before they can build integrations.",
    ],
    [
      "required_to_scale",
      "Your app must be verified before it can have more than 100 users.",
    ],
  ] as const)("keeps %s when its quote has the vocabulary", (value, quote) => {
    expect(gate(value, quote).reviewGate).toBe(value);
  });

  it("makes a gate that needs a review unknown when its quote has no such word", () => {
    expect(gate("required_to_scale", QUOTES.secret).reviewGate).toBe("unknown");
    expect(gate("security_assessment", "Copy the client ID.").reviewGate).toBe(
      "unknown",
    );
  });

  it("keeps none whatever the quote says, since 'no review' is a statement about review", () => {
    expect(gate("none", QUOTES.secret).reviewGate).toBe("none");
  });

  it("leaves a gate with no evidence unknown, as before", () => {
    const bare = withoutUnevidencedFacts({
      ...GATES_OUTPUT,
      reviewGateEvidence: null,
    });
    expect(bare.reviewGate).toBe("unknown");
  });
});
