/**
 * File: verify-claims.ts
 * Purpose: Labels every drafted claim from code-checked facts: quote on its page, a confirmed conflict, or a time estimate. The model never sets a label.
 * Exports: verifyClaims, ClaimOutcome, VerifiedClaims, TrustContext
 * Used by: agent/nodes/verify.ts
 */
import type { Claim, DowngradeReason } from "@stamp/schema";
import type { CheckRecord } from "../../services/verification-log.js";
import { labelClaim } from "../evidence/labelling.js";
import type { PageIndex } from "../extract/sanitize.js";
import type { ClaimSlot } from "../guide/claim-slots.js";
import { toLabelledClaim } from "../label-claim.js";
import { checkQuote } from "./check-quote.js";
import { trustCheck } from "./trust-checks.js";
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

/** What the trust checks need beyond the pages: the title a search result gave a page, which a fetched page does not keep. */
export type TrustContext = { titleOf: (url: string) => string | undefined };

/**
 * One claim per slot, in slot order. A claim whose quote is not on its page keeps its text as Uncertain
 * and loses its source: a quote that could not be found is never shown as one. A Sourced claim then goes
 * through the trust checks (legacy page, third-party scope names, figures the quote lacks); one that fails
 * is Uncertain with no source and a reason. A matched quote that passes keeps its source with the page's
 * tier and fetch time, whatever the label.
 */
export function verifyClaims(
  slots: readonly ClaimSlot[],
  pages: PageIndex,
  conflictedKeys: ReadonlySet<string>,
  trust: TrustContext = { titleOf: () => undefined },
): VerifiedClaims {
  const result: VerifiedClaims = { claims: [], outcomes: [], checks: [] };
  for (const { id, draft, kind } of slots) {
    const check = checkQuote(id, draft, pages);
    let decision = labelClaim({
      quote: check.match,
      conflicted: conflictedKeys.has(conflictKey(draft.url, draft.quote)),
      isTimeEstimate: kind === "estimate",
    });
    const untrusted =
      decision.label === "sourced" && check.page
        ? trustCheck({
            id,
            claimText: draft.text,
            quote: draft.quote,
            url: check.page.url,
            title: trust.titleOf(check.page.url),
            tier: check.page.tier,
          })
        : null;
    if (untrusted !== null) {
      decision = { label: "uncertain", downgrade: untrusted };
    }
    result.checks.push(check.record);
    result.outcomes.push({
      id,
      label: decision.label,
      downgrade: decision.downgrade,
      url: check.page?.url ?? draft.url,
    });
    result.claims.push(
      check.match.matched && check.page && untrusted === null
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
