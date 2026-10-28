/**
 * File: label-counts.test.ts
 * Purpose: Tests counting claims by label in a guide, in a claim list and in odd inputs.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { assembleGuide } from "./guide/assemble.js";
import { assembleInput } from "../test-support/assemble-helpers.js";
import { countLabels } from "./label-counts.js";

const claim = (label: string, sources: unknown[] = []) => ({
  id: "a.0",
  text: "t",
  label,
  sources,
});
const NONE = { claims: 0, sourced: 0, tested: 0, uncertain: 0 };

describe("countLabels", () => {
  it("counts a flat list of claims by label", () => {
    const list = [
      claim("sourced", [{}]),
      claim("sourced", [{}]),
      claim("tested", [{}]),
      claim("uncertain"),
    ];
    expect(countLabels(list)).toEqual({
      claims: 4,
      sourced: 2,
      tested: 1,
      uncertain: 1,
    });
  });

  it("finds claims nested anywhere in an object", () => {
    const nested = {
      a: { b: [claim("tested", [{}])] },
      c: { d: claim("uncertain") },
    };
    expect(countLabels(nested)).toEqual({
      claims: 2,
      sourced: 0,
      tested: 1,
      uncertain: 1,
    });
  });

  it("counts every claim in a whole guide, unknown claims as Uncertain", () => {
    const guide = assembleGuide(assembleInput());
    const counts = countLabels(guide);
    expect(counts.claims).toBe(
      counts.sourced + counts.tested + counts.uncertain,
    );
    expect(counts.sourced).toBeGreaterThan(0);
    expect(counts.uncertain).toBeGreaterThan(0);
    expect(counts.claims).toBe(
      guide.steps.length * 2 +
        guide.scopes.length +
        guide.requirements.length +
        guide.limits.length +
        4 +
        1 +
        guide.blockers.length * 3,
    );
  });

  it("does not count a source, a conflict's sides or an object with an unknown label", () => {
    const value = {
      source: { url: "u", quote: "q", tier: "official" },
      other: { label: "maybe", sources: [] },
      nolist: { label: "sourced" },
    };
    expect(countLabels(value)).toEqual(NONE);
  });

  it.each([null, undefined, 5, "text", [], {}])(
    "returns zeros for %j",
    (value) => {
      expect(countLabels(value)).toEqual(NONE);
    },
  );
});
