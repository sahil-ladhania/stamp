/**
 * File: archetype.ts
 * Purpose: Classifies an app's kind of hard (instant, hidden limits, review, partner gated, enterprise) from gate facts.
 * Exports: classifyArchetype
 * Used by: agent/nodes/score.ts
 */
import type { Archetype } from "@stamp/schema";
import type { GateFacts } from "./difficulty.js";

/**
 * An unverified review gate is unknown, whatever else is known: a kind of hard that rests on a gate nobody
 * confirmed would be a guess, and the web app shows "Not rated" for it. Otherwise the first match wins:
 * partner vetting, enterprise plan, security assessment, hidden limits, required review,
 * then instant when a gate was verified as none or optional.
 */
export function classifyArchetype(facts: GateFacts): Archetype {
  if (facts.reviewGate === "unknown") {
    return "unknown";
  }
  if (facts.reviewGate === "partner_vetting") {
    return "partner_gated";
  }
  if (facts.needsEnterprisePlan) {
    return "enterprise";
  }
  if (facts.reviewGate === "security_assessment") {
    return "review";
  }
  if (facts.hiddenLimits > 0) {
    return "hidden_limits";
  }
  if (facts.reviewGate === "required_to_scale") {
    return "review";
  }
  if (facts.reviewGate === "none" || facts.reviewGate === "optional_listing") {
    return "instant";
  }
  return "unknown";
}
