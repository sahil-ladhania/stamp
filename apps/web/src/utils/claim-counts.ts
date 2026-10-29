/**
 * File: claim-counts.ts
 * Purpose: Counts a guide's claims by label and says why the Uncertain ones are Uncertain, so the run summary and the Guide use the
 *          same numbers and the same words. An Uncertain claim that went through the quote check and failed was downgraded (the stream
 *          says which). One with no source was not found. One with a source that is a time estimate stays Uncertain by rule.
 * Exports: ClaimCounts, countClaims, describeClaimCounts
 * Used by: components/run/RunResultCard.tsx
 */
import type { Claim } from "@/types/guide-model";
import { pluralize } from "./plural";

export type ClaimCounts = {
  total: number;
  tested: number;
  sourced: number;
  uncertain: number;
  downgraded: number;
  notFound: number;
  timeEstimates: number;
  /** Uncertain with a source, not downgraded and not a time estimate. */
  unconfirmed: number;
};

const isTimeEstimate = (id: string): boolean => /\.(effort|wait)$/.test(id);

/** `downgradedIds` are the claim ids of the run's claim.downgraded events. */
export function countClaims(claims: readonly Claim[], downgradedIds: readonly string[]): ClaimCounts {
  const downgradedSet = new Set(downgradedIds);
  const counts: ClaimCounts = {
    total: claims.length,
    tested: 0,
    sourced: 0,
    uncertain: 0,
    downgraded: 0,
    notFound: 0,
    timeEstimates: 0,
    unconfirmed: 0,
  };
  for (const claim of claims) {
    if (claim.label === "tested") counts.tested += 1;
    else if (claim.label === "sourced") counts.sourced += 1;
    else {
      counts.uncertain += 1;
      if (downgradedSet.has(claim.id)) counts.downgraded += 1;
      else if (claim.sources.length === 0) counts.notFound += 1;
      else if (isTimeEstimate(claim.id)) counts.timeEstimates += 1;
      else counts.unconfirmed += 1;
    }
  }
  return counts;
}

/** "24 claims: 11 sourced, 13 uncertain (2 downgraded, 10 not found, 1 time estimate)". */
export function describeClaimCounts(counts: ClaimCounts, { hasBreakdown = true }: { hasBreakdown?: boolean } = {}): string {
  if (counts.total === 0) return "No claims";
  const parts: string[] = [];
  if (counts.tested > 0) parts.push(`${counts.tested} tested`);
  if (counts.sourced > 0) parts.push(`${counts.sourced} sourced`);
  if (counts.uncertain > 0) {
    const reasons = [
      counts.downgraded > 0 ? `${counts.downgraded} downgraded` : null,
      counts.notFound > 0 ? `${counts.notFound} not found` : null,
      counts.timeEstimates > 0 ? pluralize(counts.timeEstimates, "time estimate") : null,
      counts.unconfirmed > 0 ? `${counts.unconfirmed} unconfirmed` : null,
    ].filter((reason): reason is string => reason !== null);
    parts.push(`${counts.uncertain} uncertain${hasBreakdown && reasons.length > 0 ? ` (${reasons.join(", ")})` : ""}`);
  }
  return `${pluralize(counts.total, "claim")}: ${parts.join(", ")}`;
}
