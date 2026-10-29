/**
 * File: decide.ts
 * Purpose: Chooses the official domain from ranked candidates, or reports that the name is ambiguous or matches nothing.
 * Exports: decideOfficial, RESOLVE_TUNING, Decision, ResolveTuning
 * Used by: agent/nodes/resolve.ts
 */
import type { AppCandidate } from "@stamp/schema";
import type { Candidate } from "./candidates.js";
import { displayName } from "./typed-input.js";

export type ResolveTuning = {
  ambiguityRatio: number;
  /** A runner-up of another brand within this share of the leader, even one named only in a page title, makes the name ambiguous. */
  closeRatio: number;
  maxOptions: number;
};

/** Default thresholds, for tuning against live searches. */
export const RESOLVE_TUNING: ResolveTuning = {
  /** A runner-up scoring at least this share of the leader makes the name ambiguous. */
  ambiguityRatio: 0.6,
  /** A close call between two brands is not decided by search positions: the person is asked. */
  closeRatio: 0.9,
  /** The most "did you mean" options shown. */
  maxOptions: 3,
};

export type Decision =
  | { kind: "official"; domain: string }
  | { kind: "ambiguous"; options: AppCandidate[] }
  | { kind: "none" };

const isNamed = (candidate: Candidate): boolean =>
  candidate.match === "exact" || candidate.match === "partial";

/**
 * "none" when nothing matches the name at all (so junk search results never pick a domain).
 * "ambiguous" when two or more candidates with different brand labels both match the name and the
 * runner-up scores within the ratio of the leader. Otherwise the top candidate is the official domain.
 */
export function decideOfficial(
  candidates: Candidate[],
  tuning: ResolveTuning = RESOLVE_TUNING,
): Decision {
  const leader = candidates[0];
  if (!leader || leader.match === "none") {
    return { kind: "none" };
  }
  const byLabel = new Map<string, Candidate>();
  for (const candidate of candidates.filter(isNamed)) {
    if (!byLabel.has(candidate.label)) {
      byLabel.set(candidate.label, candidate);
    }
  }
  const named = [...byLabel.values()];
  const top = named[0];
  if (top && named.length >= 2) {
    const close = named.filter(
      (c) => c.score >= tuning.ambiguityRatio * top.score,
    );
    if (close.length >= 2) {
      return {
        kind: "ambiguous",
        options: close.slice(0, tuning.maxOptions).map((c) => ({
          name: displayName(c.label),
          domain: c.domain,
        })),
      };
    }
  }
  const close = candidates.filter(
    (c) =>
      c.label !== leader.label &&
      c.match !== "none" &&
      c.score >= tuning.closeRatio * leader.score,
  );
  if (close.length > 0) {
    const byBrand = new Map<string, Candidate>();
    for (const c of [leader, ...close]) {
      if (!byBrand.has(c.label)) byBrand.set(c.label, c);
    }
    return {
      kind: "ambiguous",
      options: [...byBrand.values()].slice(0, tuning.maxOptions).map((c) => ({
        name: displayName(c.label),
        domain: c.domain,
      })),
    };
  }
  return { kind: "official", domain: leader.domain };
}
