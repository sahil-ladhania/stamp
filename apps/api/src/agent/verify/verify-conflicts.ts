/**
 * File: verify-conflicts.ts
 * Purpose: Confirms the conflicts the model proposed using code only: both quotes real, different sources, different statements; then states the preferred source.
 * Exports: confirmConflicts, conflictKey, ConfirmedConflicts
 * Used by: agent/nodes/verify.ts
 */
import type { Claim, Conflict, Source } from "@stamp/schema";
import { normalizeUrl } from "../../utils/hash-url.js";
import { normalizeText } from "../../utils/normalize-text.js";
import type { CheckRecord } from "../../services/verification-log.js";
import type { DraftClaim } from "../draft-claim.js";
import { resolveConflict, type ConflictSide } from "../evidence/conflicts.js";
import type { PageIndex } from "../extract/sanitize.js";
import { slotId } from "../guide/claim-slots.js";
import type { PageRecord } from "../page-record.js";
import type { Drafts } from "../state.js";
import { checkQuote } from "./check-quote.js";

export type ConfirmedConflicts = {
  conflicts: Conflict[];
  /** Keys (see conflictKey) of the claims that take part in a confirmed conflict. */
  conflictedKeys: Set<string>;
  checks: CheckRecord[];
};

/** Identifies a quote on a page, whatever form the URL or the whitespace takes. */
export function conflictKey(url: string, quote: string): string {
  let page = url;
  try {
    page = normalizeUrl(url);
  } catch {
    // Not an http(s) URL: compare it as written.
  }
  return `${page}|${normalizeText(quote)}`;
}

function sourceOf(draft: DraftClaim, page: PageRecord): Source {
  return {
    url: page.url,
    quote: draft.quote,
    tier: page.tier,
    retrievedAt: page.fetchedAt,
  };
}

/** Confirmed conflicts get ids conflicts.0, conflicts.1 ... in the order proposed; a dismissed proposal takes no id. */
export function confirmConflicts(
  drafts: Drafts,
  pages: PageIndex,
): ConfirmedConflicts {
  const result: ConfirmedConflicts = {
    conflicts: [],
    conflictedKeys: new Set(),
    checks: [],
  };
  if (drafts.conflicts?.status !== "drafted") {
    return result;
  }
  drafts.conflicts.payload.conflicts.forEach((proposed, index) => {
    const a = checkQuote(
      `conflicts.proposed.${index}.sourceA`,
      proposed.sourceA,
      pages,
    );
    const b = checkQuote(
      `conflicts.proposed.${index}.sourceB`,
      proposed.sourceB,
      pages,
    );
    result.checks.push(a.record, b.record);
    const side = (draft: DraftClaim, check: typeof a): ConflictSide => ({
      draft,
      tier: check.page?.tier ?? "third_party",
      quoteMatched: check.match.matched,
    });
    const verdict = resolveConflict({
      topic: proposed.topic,
      a: side(proposed.sourceA, a),
      b: side(proposed.sourceB, b),
    });
    if (!verdict.confirmed || !a.page || !b.page) {
      return;
    }
    const sourceA = sourceOf(proposed.sourceA, a.page);
    const sourceB = sourceOf(proposed.sourceB, b.page);
    const id = result.conflicts.length;
    const reason: Claim = {
      id: slotId.conflictReason(id),
      text: `The sources disagree about ${proposed.topic}. ${verdict.reason}`,
      label: "sourced",
      sources: [sourceA, sourceB],
    };
    result.conflicts.push({
      id: slotId.conflict(id),
      topic: proposed.topic,
      sourceA,
      sourceB,
      preferredUrl: verdict.preferred === "a" ? sourceA.url : sourceB.url,
      reason,
    });
    result.conflictedKeys.add(conflictKey(sourceA.url, sourceA.quote));
    result.conflictedKeys.add(conflictKey(sourceB.url, sourceB.quote));
  });
  return result;
}
