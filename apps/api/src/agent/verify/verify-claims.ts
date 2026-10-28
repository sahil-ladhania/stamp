/**
 * File: verify-claims.ts
 * Purpose: Labels every drafted claim from code-checked facts: quote on its page, a confirmed conflict, or a time estimate. The model never sets a label.
 * Exports: verifyClaims, ClaimOutcome, VerifiedClaims
 * Used by: agent/nodes/verify.ts
 */
import type { Claim, DowngradeReason } from "@stamp/schema";
import type { CheckRecord } from "../../services/verification-log.js";
import { labelClaim } from "../evidence/labelling.js";
import type { PageIndex } from "../extract/sanitize.js";
import type { ClaimSlot } from "../guide/claim-slots.js";
import { toLabelledClaim } from "../label-claim.js";
import { checkQuote } from "./check-quote.js";
import { conflictKey } from "./verify-conflicts.js";

/** What happened to one claim: its label, why it was downgraded (null when nothing failed) and the page it cites. */
export type ClaimOutcome = {
  id: string;
  label: Claim["label"];
  downgrade: DowngradeReason | null;
  url: string;
};
export type VerifiedClaims = {
  claims: Claim[];
  outcomes: ClaimOutcome[];
  checks: CheckRecord[];
};

/**
 * One claim per slot, in slot order. A claim whose quote is not on its page keeps its text as Uncertain
 * and loses its source: a quote that could not be found is never shown as one. A matched quote keeps
 * its source with the page's tier and fetch time, whatever the label.
 */
export function verifyClaims(
  slots: readonly ClaimSlot[],
  pages: PageIndex,
  conflictedKeys: ReadonlySet<string>,
): VerifiedClaims {
  const result: VerifiedClaims = { claims: [], outcomes: [], checks: [] };
  for (const { id, draft, kind } of slots) {
    const check = checkQuote(id, draft, pages);
    const decision = labelClaim({
      quote: check.match,
      conflicted: conflictedKeys.has(conflictKey(draft.url, draft.quote)),
      isTimeEstimate: kind === "estimate",
    });
    result.checks.push(check.record);
    result.outcomes.push({
      id,
      label: decision.label,
      downgrade: decision.downgrade,
      url: check.page?.url ?? draft.url,
    });
    result.claims.push(
      check.match.matched && check.page
        ? toLabelledClaim(
            { ...draft, url: check.page.url },
            decision.label,
            id,
            check.page.tier,
            check.page.fetchedAt,
          )
        : { id, text: draft.text, label: decision.label, sources: [] },
    );
  }
  return result;
}
