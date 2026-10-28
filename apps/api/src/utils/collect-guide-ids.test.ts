/**
 * File: collect-guide-ids.test.ts
 * Purpose: Tests collecting ids from nested guide sections.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { collectGuideIds } from "./collect-guide-ids.js";

describe("collectGuideIds", () => {
  it("collects ids from nested objects and arrays", () => {
    const guide = {
      verdict: { summary: { id: "verdict.summary", text: "x" } },
      steps: [
        { id: "steps.0", detail: { id: "steps.0.detail" } },
        { id: "steps.1", detail: { id: "steps.1.detail" } },
      ],
      blockers: [{ id: "blockers.0", contact: null }],
    };
    expect([...collectGuideIds(guide)].sort()).toEqual([
      "blockers.0",
      "steps.0",
      "steps.0.detail",
      "steps.1",
      "steps.1.detail",
      "verdict.summary",
    ]);
  });

  it("ignores non-string ids and scalar values", () => {
    expect(collectGuideIds({ id: 5, nested: [1, "a", null] }).size).toBe(0);
  });

  it("returns an empty set for non-objects", () => {
    expect(collectGuideIds(null).size).toBe(0);
    expect(collectGuideIds("steps.0").size).toBe(0);
  });
});
