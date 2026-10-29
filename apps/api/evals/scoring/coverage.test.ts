/**
 * File: coverage.test.ts
 * Purpose: Tests the coverage check: which of the five key fields a guide answers.
 * Exports: (none)
 * Used by: vitest
 */
import type { Claim } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import { scoreCoverage, type CoverageGuide } from "./coverage.js";

const claim = (label: Claim["label"]): Claim => ({
  id: "x.0",
  text: label === "uncertain" ? "Not found in the fetched sources." : "A fact",
  label,
  sources:
    label === "uncertain"
      ? []
      : [
          {
            url: "https://docs.acme.com/a",
            quote: "a fact here",
            tier: "official",
          },
        ],
});

const guide = (label: Claim["label"]): CoverageGuide => ({
  scopes: [{ id: "scopes.0", name: "read", reason: claim(label) }],
  steps: [
    {
      id: "steps.0",
      title: "t",
      detail: claim(label),
      actor: "human",
      effort: claim("uncertain"),
    },
  ],
  blockers: [
    {
      id: "blockers.0",
      symptom: claim(label),
      cause: claim(label),
      fix: claim(label),
      contact: null,
    },
  ],
});

describe("scoreCoverage", () => {
  it("counts a field answered when it holds a Sourced or Tested claim", () => {
    const result = scoreCoverage({
      gate: "optional_listing",
      wait: { minDays: 7, maxDays: 14 },
      guide: guide("sourced"),
    });
    expect(result.missing).toEqual([]);
    expect(result.answered).toEqual([
      "reviewGate",
      "approvalWait",
      "scopes",
      "blockers",
      "steps",
    ]);
  });

  it("counts a known no-wait as answered", () => {
    expect(
      scoreCoverage({ gate: "none", wait: "none", guide: guide("tested") })
        .missing,
    ).toEqual([]);
  });

  it("leaves a field missing when only Uncertain claims fill it", () => {
    const result = scoreCoverage({
      gate: "unknown",
      wait: "unknown",
      guide: guide("uncertain"),
    });
    expect(result.answered).toEqual([]);
    expect(result.missing).toEqual([
      "reviewGate",
      "approvalWait",
      "scopes",
      "blockers",
      "steps",
    ]);
  });

  it("treats a run with no guide as nothing answered", () => {
    expect(
      scoreCoverage({ gate: "none", wait: "none", guide: null }).answered,
    ).toEqual(["reviewGate", "approvalWait"]);
  });

  it("leaves scopes missing when the guide lists none", () => {
    const result = scoreCoverage({
      gate: "none",
      wait: "none",
      guide: { ...guide("sourced"), scopes: [] },
    });
    expect(result.missing).toEqual(["scopes"]);
  });
});
