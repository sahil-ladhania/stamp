/**
 * File: claim-counts.test.ts
 * Purpose: Tests the claim counts and their wording: the Uncertain breakdown, the plural of "time estimate", and a guide with no events.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { Claim } from "@/types/guide-model";
import { countClaims, describeClaimCounts } from "./claim-counts";

function claim(id: string, label: Claim["label"], sources = 0): Claim {
  return {
    id,
    text: id,
    label,
    sources: Array.from({ length: sources }, (_, i) => ({ url: `https://docs.example.com/${i}`, title: "t", tier: "official" as const })),
  };
}

const claims = [
  claim("requirements.0", "sourced", 1),
  claim("steps.0.detail", "sourced", 1),
  claim("steps.1.detail", "uncertain"),
  claim("limits.0", "uncertain"),
  claim("milestones.firstTest.effort", "uncertain", 1),
  claim("milestones.production.wait", "uncertain"),
];

describe("countClaims", () => {
  it("splits Uncertain into downgraded, not found, time estimates and unconfirmed", () => {
    const counts = countClaims([...claims, claim("scopes.0.reason", "uncertain", 1)], ["steps.1.detail"]);
    expect(counts).toMatchObject({
      total: 7, sourced: 2, uncertain: 5, downgraded: 1, notFound: 2, timeEstimates: 1, unconfirmed: 1,
    });
  });

  it("ignores a downgraded id that is not an Uncertain claim in the guide", () => {
    expect(countClaims(claims, ["requirements.0"]).downgraded).toBe(0);
  });
});

describe("describeClaimCounts", () => {
  it("says the sourced and uncertain counts and why", () => {
    expect(describeClaimCounts(countClaims(claims, ["steps.1.detail"]))).toBe(
      "6 claims: 2 sourced, 4 uncertain (1 downgraded, 2 not found, 1 time estimate)",
    );
  });

  it("writes the plural of time estimate in full", () => {
    const text = describeClaimCounts(
      countClaims([claim("steps.0.effort", "uncertain", 1), claim("steps.1.effort", "uncertain", 1)], []),
    );
    expect(text).toBe("2 claims: 2 uncertain (2 time estimates)");
  });

  it("names tested claims and leaves out a zero part", () => {
    const text = describeClaimCounts(countClaims([claim("a.0", "tested", 1), claim("limits.0", "sourced", 1)], []));
    expect(text).toBe("2 claims: 1 tested, 1 sourced");
  });

  it("can leave the breakdown out, for a run whose events are gone", () => {
    expect(describeClaimCounts(countClaims(claims, []), { hasBreakdown: false })).toBe("6 claims: 2 sourced, 4 uncertain");
  });

  it("uses the singular for one claim, and handles none", () => {
    expect(describeClaimCounts(countClaims([claim("limits.0", "sourced", 1)], []))).toBe("1 claim: 1 sourced");
    expect(describeClaimCounts(countClaims([], []))).toBe("No claims");
  });
});
