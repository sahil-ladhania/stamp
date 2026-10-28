/**
 * File: archetype.ts
 * Purpose: Classifies an app's kind of hard (instant, hidden limits, review, partner gated, enterprise) from gate facts.
 * Exports: classifyArchetype
 * Used by: agent/nodes/score.ts
 */
import type { Archetype } from "@stamp/schema";
import type { GateFacts } from "./difficulty.js";

/**
 * First match wins:
 * partner vetting, enterprise plan, security assessment, hidden limits, required review,
 * then instant when a gate was verified as none or optional. With no verified facts it is unknown.
 */
export function classifyArchetype(facts: GateFacts): Archetype {
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
