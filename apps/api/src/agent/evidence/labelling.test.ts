/**
 * File: labelling.test.ts
 * Purpose: Tests every label path and the rule that tested only comes from a passing probe.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { applyProbe, labelClaim } from "./labelling.js";
import type { QuoteMatch } from "./quote-match.js";

const found: QuoteMatch = { matched: true };
const missing: QuoteMatch = { matched: false, reason: "not_found" };

describe("labelClaim", () => {
  it("labels a matched, undisputed claim sourced", () => {
    expect(
      labelClaim({ quote: found, conflicted: false, isTimeEstimate: false }),
    ).toEqual({
      label: "sourced",
      downgrade: null,
    });
  });

  it("downgrades a claim whose quote is not on the page", () => {
    expect(
      labelClaim({ quote: missing, conflicted: false, isTimeEstimate: false }),
    ).toEqual({
      label: "uncertain",
      downgrade: "quote_not_found",
    });
  });

  it("treats every unmatched reason as a missing quote", () => {
    for (const reason of [
      "empty_quote",
      "quote_too_short",
      "empty_page",
      "not_found",
    ] as const) {
      const decision = labelClaim({
        quote: { matched: false, reason },
        conflicted: false,
        isTimeEstimate: false,
      });
      expect(decision).toEqual({
        label: "uncertain",
        downgrade: "quote_not_found",
      });
    }
  });

  it("downgrades a matched claim that sources disagree on", () => {
    expect(
      labelClaim({ quote: found, conflicted: true, isTimeEstimate: false }),
    ).toEqual({
      label: "uncertain",
      downgrade: "sources_disagree",
    });
  });

  it("keeps a matched time estimate uncertain without reporting a failed check", () => {
    expect(
      labelClaim({ quote: found, conflicted: false, isTimeEstimate: true }),
    ).toEqual({
      label: "uncertain",
      downgrade: null,
    });
  });

  it("reports a missing quote even for a time estimate", () => {
    expect(
      labelClaim({ quote: missing, conflicted: false, isTimeEstimate: true })
        .downgrade,
    ).toBe("quote_not_found");
  });

  it("reports a missing quote before a conflict", () => {
    expect(
      labelClaim({ quote: missing, conflicted: true, isTimeEstimate: false })
        .downgrade,
    ).toBe("quote_not_found");
  });

  it("reports a conflict before the time estimate rule", () => {
    expect(
      labelClaim({ quote: found, conflicted: true, isTimeEstimate: true })
        .downgrade,
    ).toBe("sources_disagree");
  });

  it("never returns tested", () => {
    for (const quote of [found, missing]) {
      for (const conflicted of [true, false]) {
        for (const isTimeEstimate of [true, false]) {
          expect(
            labelClaim({ quote, conflicted, isTimeEstimate }).label,
          ).not.toBe("tested");
        }
      }
    }
  });
});

describe("applyProbe", () => {
  it("promotes a sourced claim to tested only when the probe passed", () => {
    expect(applyProbe("sourced", "passed")).toBe("tested");
  });

  it("leaves a sourced claim alone when the probe failed or was skipped", () => {
    expect(applyProbe("sourced", "failed")).toBe("sourced");
    expect(applyProbe("sourced", "skipped")).toBe("sourced");
  });

  it("never promotes an uncertain claim, whatever the probe says", () => {
    for (const probe of ["passed", "failed", "skipped"] as const) {
      expect(applyProbe("uncertain", probe)).toBe("uncertain");
    }
  });

  it("never demotes a tested claim", () => {
    for (const probe of ["passed", "failed", "skipped"] as const) {
      expect(applyProbe("tested", probe)).toBe("tested");
    }
  });
});
