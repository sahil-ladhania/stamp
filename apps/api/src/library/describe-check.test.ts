/**
 * File: describe-check.test.ts
 * Purpose: Tests the terminal lines for a library check: one line per rule, a few ids shown, notes prefixed.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { describeFailures, describeNotes } from "./describe-check.js";

const finding = (rule: "official_source" | "coverage", claimId?: string) => ({
  rule,
  claimId,
  message:
    rule === "coverage"
      ? "coverage is partial"
      : "sourced claim with no official source",
});

describe("describeFailures", () => {
  it("gives a rule with several claims one line, with the first three ids", () => {
    const failures = ["a.0", "a.1", "a.2", "a.3", "a.4"].map((id) =>
      finding("official_source", id),
    );
    expect(describeFailures(failures)).toEqual([
      "  fails official_source: sourced claim with no official source (5 claims: a.0, a.1, a.2, and 2 more)",
    ]);
  });

  it("gives a rule with no claim id its message alone", () => {
    expect(describeFailures([finding("coverage")])).toEqual([
      "  fails coverage: coverage is partial",
    ]);
  });

  it("gives one line per rule, in the order the rules first appear", () => {
    const lines = describeFailures([
      finding("coverage"),
      finding("official_source", "a.0"),
    ]);
    expect(lines.map((line) => line.split(":")[0])).toEqual([
      "  fails coverage",
      "  fails official_source",
    ]);
  });

  it("says nothing when nothing failed", () => {
    expect(describeFailures([])).toEqual([]);
  });
});

describe("describeNotes", () => {
  it("prefixes each note", () => {
    expect(describeNotes(["no scopes listed"])).toEqual([
      "  note: no scopes listed",
    ]);
  });
});
