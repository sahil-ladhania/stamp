/**
 * File: extraction.test.ts
 * Purpose: Valid and invalid examples for section extraction schemas.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  ExtractPlanOutputSchema,
  ExtractStepsOutputSchema,
} from "./extraction.js";

const draft = {
  text: "Create an app",
  quote: "Create an app",
  url: "https://example.com/docs",
};

describe("ExtractPlanOutputSchema", () => {
  it("accepts planned queries", () => {
    expect(
      ExtractPlanOutputSchema.safeParse({ queries: ["hubspot oauth scopes"] })
        .success,
    ).toBe(true);
  });

  it("rejects empty queries", () => {
    expect(ExtractPlanOutputSchema.safeParse({ queries: [] }).success).toBe(
      false,
    );
  });
});

describe("ExtractStepsOutputSchema", () => {
  it("accepts steps without labels", () => {
    expect(
      ExtractStepsOutputSchema.safeParse({
        steps: [
          {
            title: "Create developer account",
            detail: draft,
            actor: "human",
            effort: draft,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects a step with label on detail", () => {
    expect(
      ExtractStepsOutputSchema.safeParse({
        steps: [
          {
            title: "Step",
            detail: { ...draft, label: "sourced" },
            actor: "human",
            effort: draft,
          },
        ],
      }).success,
    ).toBe(false);
  });
});
