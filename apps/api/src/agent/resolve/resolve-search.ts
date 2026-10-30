/**
 * File: resolve-search.ts
 * Purpose: Resolve's searching: the first search, one retry when it fails, and one second look when the first answer is thin (nothing decided, a question, or a winner with no documentation page). The node and the resolve stress test both use it.
 * Exports: resolveWithSearch, needsSecondLook, mergeHits, RESOLVE_QUERY, SECOND_LOOK_QUERY, RESOLVE_MAX_RESULTS, SearchFn, Searched
 * Used by: agent/nodes/resolve.ts, evals/resolve/resolve-one.ts
 */
import type { ResolveHit } from "./candidates.js";
import { resolveFromHits, type ResolveFromHits } from "./resolve-from-hits.js";

export const RESOLVE_MAX_RESULTS = 8;

/**
 * The one search that finds an app's official site from its name. It carries no generic OAuth words: "OAuth"
 * in it returned Google's own OAuth pages for Gmail (none titled "Gmail", so no domain matched the name).
 */
export const RESOLVE_QUERY = (name: string): string =>
  `${name} API developer documentation`;

/** The second look asks differently, so it can reach pages the first query did not: the developer portal, not the API. */
export const SECOND_LOOK_QUERY = (name: string): string =>
  `${name} developer portal`;

/** `attempt` is "first" for the first search and "again" for a retry or the second look, which the caller may give less time. */
export type SearchFn = (
  query: string,
  attempt: "first" | "again",
) => Promise<{ hits: ResolveHit[]; credits: number | null }>;

export type Searched = ResolveFromHits & {
  /** Every hit seen, the first search's first, without repeats. */
  hits: ResolveHit[];
  queries: string[];
  credits: number | null;
  /** True when the second look ran. */
  lookedAgain: boolean;
  /** True when the first search failed once and was tried again. */
  retried: boolean;
};

/** The hits of both searches, in order, each URL once. */
export function mergeHits(
  first: ResolveHit[],
  second: ResolveHit[],
): ResolveHit[] {
  const seen = new Set(first.map((hit) => hit.url));
  return [...first, ...second.filter((hit) => !seen.has(hit.url))];
}

/**
 * The first answer is thin when nothing was decided, a question was asked, or the winner has no hit that looks like
 * documentation. A clear answer on documentation pages never costs a second search.
 */
export function needsSecondLook(result: ResolveFromHits): boolean {
  const { decision, candidates } = result;
  if (decision.kind !== "official") return true;
  return (
    candidates.find((candidate) => candidate.domain === decision.domain)
      ?.docs !== true
  );
}

const addCredits = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : (a ?? 0) + (b ?? 0);

/**
 * One search; if it throws and `shouldRetry` allows, one more. Then, when the answer is thin, one second look with
 * another query, merged with the first hits. A second look that fails keeps the first answer: it was a bonus, not
 * the run. A first search that fails twice throws its last error.
 */
export async function resolveWithSearch(
  name: string,
  search: SearchFn,
  shouldRetry: () => boolean = () => true,
): Promise<Searched> {
  const queries = [RESOLVE_QUERY(name)];
  let retried = false;
  let first;
  try {
    first = await search(queries[0] as string, "first");
  } catch (err) {
    if (!shouldRetry()) throw err;
    retried = true;
    first = await search(queries[0] as string, "again");
  }
  let hits = first.hits;
  let credits = first.credits;
  let result = resolveFromHits(name, hits);
  let lookedAgain = false;
  if (needsSecondLook(result) && shouldRetry()) {
    const query = SECOND_LOOK_QUERY(name);
    try {
      const second = await search(query, "again");
      queries.push(query);
      lookedAgain = true;
      credits = addCredits(credits, second.credits);
      hits = mergeHits(hits, second.hits);
      result = resolveFromHits(name, hits);
    } catch {
      // The first look already gave an answer; a failed extra look does not change it.
    }
  }
  return { ...result, hits, queries, credits, lookedAgain, retried };
}
