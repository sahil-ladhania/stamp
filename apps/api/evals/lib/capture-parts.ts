/**
 * File: capture-parts.ts
 * Purpose: Reads the pieces of a run's capture out of its final state, its log lines and its events: gate facts with evidence, search results, resolve hits and pages.
 * Exports: gatesOf, searchResultsOf, resolveHitsOf, pagesFromEvents
 * Used by: evals/lib/run-one.ts
 */
import type { SourceTier } from "@stamp/schema";
import { stageOf } from "../../src/agent/pipeline.js";
import { toGateFacts } from "../../src/agent/scoring/gate-facts.js";
import type { SearchResult } from "../../src/agent/search-result.js";
import type { State } from "../../src/agent/state.js";
import { hashUrl } from "../../src/utils/hash-url.js";
import type {
  GateCapture,
  GateEvidence,
  PageInfo,
  ResolveHit,
  SearchResultInfo,
  TraceEvent,
} from "./types.js";

const VERIFY_STAGE = stageOf("verify");

/**
 * Gates count only after verify checked their quotes, as in the score stage. Each known fact keeps the
 * tier of its page and the quote and URL it rests on; an unknown fact keeps none.
 */
export function gatesOf(state: State): GateCapture {
  const checked = state.completed.includes(VERIFY_STAGE);
  const facts = toGateFacts(checked ? state.gates : null);
  const tierOf = (url: string | undefined): SourceTier | null =>
    url === undefined
      ? null
      : (state.pages.find((page) => page.urlHash === hashUrl(url))?.tier ??
        null);
  const evidenceOf = (
    claim: { url: string; quote: string } | null | undefined,
    isKnown: boolean,
  ): GateEvidence | null =>
    isKnown && claim ? { url: claim.url, quote: claim.quote } : null;
  const review = state.gates?.reviewGateEvidence;
  const wait = state.gates?.approvalWaitEvidence;
  const reviewKnown = facts.reviewGate !== "unknown";
  const waitKnown = facts.approvalWait !== "unknown";
  return {
    reviewGate: facts.reviewGate,
    reviewGateTier: reviewKnown ? tierOf(review?.url) : null,
    reviewGateEvidence: evidenceOf(review, reviewKnown),
    approvalWait: facts.approvalWait,
    approvalWaitTier: waitKnown ? tierOf(wait?.url) : null,
    approvalWaitEvidence: evidenceOf(wait, waitKnown),
  };
}

/** Every search result the run saw, with the detail the stage tests and the retrieval metrics need. */
export function searchResultsOf(
  results: readonly SearchResult[],
): SearchResultInfo[] {
  return results.map(({ url, tier, title, score, topics }) => ({
    url,
    tier,
    ...(title === undefined ? {} : { title }),
    ...(score === undefined ? {} : { score }),
    ...(topics === undefined ? {} : { topics }),
  }));
}

/** The hits the resolve stage logged; a line or entry that does not have a URL and a title is skipped. */
export function resolveHitsOf(
  logs: readonly Record<string, unknown>[],
): ResolveHit[] {
  const line = logs.find((entry) => entry.message === "resolve summary");
  const hits = line?.resolveHits;
  if (!Array.isArray(hits)) return [];
  return hits.flatMap((hit: unknown) => {
    const { url, title } = (hit ?? {}) as Record<string, unknown>;
    return typeof url === "string" && typeof title === "string"
      ? [{ url, title }]
      : [];
  });
}

/** With no final state (the run failed early) the pages are the ones the events announced. */
export function pagesFromEvents(events: readonly TraceEvent[]): PageInfo[] {
  return events.flatMap(({ event }) =>
    event.type === "page.fetched"
      ? [{ url: String(event.url), tier: event.tier as SourceTier }]
      : [],
  );
}
