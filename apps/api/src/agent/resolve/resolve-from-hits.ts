/**
 * File: resolve-from-hits.ts
 * Purpose: The decision part of Resolve, from a name and its search hits: the ranked candidates, the decision and, when it is official, the identity. No search, no events, so the resolve node and the resolve stress test make the same decision.
 * Exports: resolveFromHits, ResolveFromHits
 * Used by: agent/nodes/resolve.ts, evals/resolve/resolve-one.ts
 */
import {
  rankCandidates,
  type Candidate,
  type ResolveHit,
} from "./candidates.js";
import { decideOfficial, type Decision } from "./decide.js";
import { deriveIdentity, type Derived } from "./identity.js";

export type ResolveFromHits = {
  candidates: Candidate[];
  decision: Decision;
  /** Set only when the decision is official. */
  identity: Derived | null;
};

export function resolveFromHits(
  name: string,
  hits: ResolveHit[],
): ResolveFromHits {
  const candidates = rankCandidates(name, hits);
  const decision = decideOfficial(candidates);
  const identity =
    decision.kind === "official"
      ? deriveIdentity(name, hits, candidates, decision.domain)
      : null;
  return { candidates, decision, identity };
}
