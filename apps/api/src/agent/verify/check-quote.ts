/**
 * File: check-quote.ts
 * Purpose: Checks one draft claim's quote against the page it cites, and records the check with the page's content hash.
 * Exports: checkQuote, QuoteCheck
 * Used by: agent/verify/verify-claims.ts, agent/verify/verify-gates.ts, agent/verify/verify-conflicts.ts
 */
import type { CheckRecord } from "../../services/verification-log.js";
import type { DraftClaim } from "../draft-claim.js";
import { matchQuote, type QuoteMatch } from "../evidence/quote-match.js";
import { pageFor, type PageIndex } from "../extract/sanitize.js";
import type { PageRecord } from "../page-record.js";

export type QuoteCheck = {
  match: QuoteMatch;
  page: PageRecord | null;
  record: CheckRecord;
};

/**
 * Looks the page up by the claim's URL and matches the quote word for word (after normalising both).
 * A claim on a page that is not held cannot match. The record names the page version by its content hash.
 */
export function checkQuote(
  claimId: string,
  draft: DraftClaim,
  pages: PageIndex,
): QuoteCheck {
  const page = pageFor(draft.url, pages) ?? null;
  const match: QuoteMatch = page
    ? matchQuote(draft.quote, page.text)
    : { matched: false, reason: "empty_page" };
  return {
    match,
    page,
    record: {
      claimId,
      method: "quote_match",
      result: match.matched ? "pass" : "fail",
      detail: {
        ...(page ? { contentHash: page.contentHash } : {}),
        ...(match.matched
          ? {}
          : { reason: page ? match.reason : "page_not_fetched" }),
      },
      sourceUrl: page?.url ?? draft.url,
    },
  };
}
