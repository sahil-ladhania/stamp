/**
 * File: gate-facts.ts
 * Purpose: Turns the verified gates into the facts the difficulty rule scores; anything missing, unevidenced or invalid counts as unknown.
 * Exports: toGateFacts, UNKNOWN_FACTS
 * Used by: agent/nodes/score.ts
 */
import { normalizeText } from "../../utils/normalize-text.js";
import type { DraftClaim } from "../draft-claim.js";
import type { SectionOutput } from "../extract/sections.js";
import type { ApprovalWait, GateFacts } from "./difficulty.js";

type Gates = SectionOutput<"gates">;

/** What a run with no gates scores: no review gate found, the wait unknown (it counts 2), nothing else. */
export const UNKNOWN_FACTS: GateFacts = {
  reviewGate: "unknown",
  approvalWait: "unknown",
  prerequisites: 0,
  hiddenLimits: 0,
  needsEnterprisePlan: false,
};

/** A range needs both ends, in order; anything else is not a wait we know. */
function waitOf(gates: Gates): ApprovalWait {
  if (gates.approvalWaitEvidence === null) return "unknown";
  if (gates.approvalWait === "none") return "none";
  const { approvalWaitMinDays: min, approvalWaitMaxDays: max } = gates;
  return gates.approvalWait === "range" &&
    min !== null &&
    max !== null &&
    min <= max
    ? { minDays: min, maxDays: max }
    : "unknown";
}

/** The same sentence quoted twice is one prerequisite. */
const distinct = (claims: readonly DraftClaim[]): number =>
  new Set(claims.map((claim) => normalizeText(claim.quote))).size;

/** Gates with no evidence for a fact, or no gates at all, give the unknown value for that fact. Nothing here throws. */
export function toGateFacts(gates: Gates | null): GateFacts {
  if (gates === null) return UNKNOWN_FACTS;
  return {
    reviewGate:
      gates.reviewGateEvidence === null ? "unknown" : gates.reviewGate,
    approvalWait: waitOf(gates),
    prerequisites: distinct(gates.prerequisites),
    hiddenLimits: distinct(gates.hiddenLimits),
    needsEnterprisePlan: gates.enterprisePlanEvidence !== null,
  };
}
