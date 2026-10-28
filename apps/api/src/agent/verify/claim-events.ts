/**
 * File: claim-events.ts
 * Purpose: Builds the claim.verified and claim.downgraded events for a verify pass, skipping claims a retry pass left unchanged.
 * Exports: claimEvents
 * Used by: agent/nodes/verify.ts
 */
import type { Claim } from "@stamp/schema";
import type { EventBody } from "../emit.js";
import type { ClaimOutcome } from "./verify-claims.js";

const sameClaim = (a: Claim, b: Claim): boolean =>
  a.id === b.id && a.label === b.label && a.text === b.text;

/**
 * Sourced claims are verified, downgraded ones say why; a time estimate with a real quote is Uncertain by
 * rule and sends nothing. On a retry pass only claims that are new or changed since `previous` send an event.
 */
export function claimEvents(
  claims: readonly Claim[],
  outcomes: readonly ClaimOutcome[],
  previous: readonly Claim[],
): EventBody[] {
  const events: EventBody[] = [];
  claims.forEach((claim, i) => {
    const outcome = outcomes[i];
    if (!outcome || previous.some((old) => sameClaim(old, claim))) return;
    if (outcome.downgrade !== null) {
      events.push({
        type: "claim.downgraded",
        claimId: outcome.id,
        reason: outcome.downgrade,
      });
    } else if (outcome.label === "sourced") {
      events.push({
        type: "claim.verified",
        claimId: outcome.id,
        url: outcome.url,
      });
    }
  });
  return events;
}
