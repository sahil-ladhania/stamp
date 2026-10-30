/**
 * File: resolve-one.ts
 * Purpose: Runs Resolve alone for one typed provider (read the typed text, one search, rank, decide, derive the identity) and keeps what it saw, so a run can be read later and decided again for free.
 * Exports: resolveOne, replayOne, ResolveRecord, SearchFn, Entry
 * Used by: evals/resolve/cli.ts
 */
import type { ResolveHit } from "../../src/agent/resolve/candidates.js";
import { resolveFromHits } from "../../src/agent/resolve/resolve-from-hits.js";
import { parseTyped } from "../../src/agent/resolve/typed-input.js";
import { RESOLVE_QUERY } from "../../src/agent/nodes/resolve.js";
import { errorText } from "../../src/utils/error-text.js";
import { classify, type Decided, type Outcome } from "./classify.js";
import type { Provider } from "./providers.js";

/** The parts of a list entry a run needs; a saved record carries them too. */
export type Entry = Pick<Provider, "typed" | "types" | "expected" | "control">;

export type SearchFn = (
  query: string,
) => Promise<{ hits: ResolveHit[]; credits: number | null }>;

export type ResolveRecord = {
  typed: string;
  types: Provider["types"];
  expected: string[];
  control: boolean;
  /** "typed": a domain or URL, no search. "search": a name, one search. "empty": nothing to look up. */
  via: "typed" | "search" | "empty";
  name: string;
  query: string | null;
  hits: ResolveHit[];
  decision: Decided["decision"];
  domain: string | null;
  domains: string[];
  product: string | null;
  options: { name: string; domain: string }[];
  candidates: { domain: string; match: string; score: number; hits: number }[];
  error: string | null;
  credits: number | null;
  outcome: Outcome;
};

type Looked = Pick<
  ResolveRecord,
  "via" | "name" | "query" | "hits" | "credits" | "error"
>;

function recordOf(
  entry: Entry,
  looked: Looked,
  decided: Partial<ResolveRecord> & Decided,
): ResolveRecord {
  return {
    typed: entry.typed,
    types: entry.types,
    expected: entry.expected,
    control: entry.control === true,
    ...looked,
    domain: null,
    product: null,
    candidates: [],
    ...decided,
    outcome: classify(decided, entry.expected),
  };
}

/** The decision from what was looked up. Used for a fresh search and for a replay of a saved one. */
function decideFrom(entry: Entry, looked: Looked): ResolveRecord {
  if (looked.error !== null) {
    return recordOf(entry, looked, {
      decision: "error",
      domains: [],
      options: [],
    });
  }
  if (looked.via === "typed") {
    const domain = parseTyped(entry.typed);
    const found = domain.kind === "domain" ? domain.domain : null;
    return recordOf(entry, looked, {
      decision: found ? "official" : "none",
      domain: found,
      domains: found ? [found] : [],
      options: [],
    });
  }
  const { candidates, decision, identity } = resolveFromHits(
    looked.name,
    looked.hits,
  );
  return recordOf(entry, looked, {
    decision:
      decision.kind === "official"
        ? "official"
        : decision.kind === "ambiguous"
          ? "ambiguous"
          : "none",
    domain: decision.kind === "official" ? decision.domain : null,
    domains: identity?.domains ?? [],
    product: identity?.product ?? null,
    options: decision.kind === "ambiguous" ? decision.options : [],
    candidates: candidates.slice(0, 5).map((c) => ({
      domain: c.domain,
      match: c.match,
      score: Math.round(c.score * 100) / 100,
      hits: c.hits,
    })),
  });
}

/** What the resolve node does for this typed text, with the search injected. A failed search is recorded, not thrown. */
export async function resolveOne(
  entry: Entry,
  search: SearchFn,
): Promise<ResolveRecord> {
  const typed = parseTyped(entry.typed);
  const none = { query: null, hits: [], credits: null, error: null };
  if (typed.kind === "domain") {
    return decideFrom(entry, { via: "typed", name: typed.name, ...none });
  }
  if (typed.name === "") {
    return decideFrom(entry, { via: "empty", name: "", ...none });
  }
  const query = RESOLVE_QUERY(typed.name);
  try {
    const { hits, credits } = await search(query);
    return decideFrom(entry, {
      via: "search",
      name: typed.name,
      query,
      hits,
      credits,
      error: null,
    });
  } catch (err) {
    return decideFrom(entry, {
      via: "search",
      name: typed.name,
      query,
      hits: [],
      credits: null,
      error: errorText(err),
    });
  }
}

/**
 * Decides again, with today's code, from the hits a saved record kept. No search, no credits. The list entry gives the
 * expected domains when it is still in the list; otherwise the saved record's own are used.
 */
export function replayOne(
  entry: Entry | undefined,
  saved: ResolveRecord,
): ResolveRecord {
  const { via, name, query, hits, credits, error } = saved;
  const kept: Entry = entry ?? {
    typed: saved.typed,
    types: saved.types,
    expected: saved.expected,
    ...(saved.control ? { control: true as const } : {}),
  };
  return decideFrom(kept, { via, name, query, hits, credits, error });
}
