/**
 * File: search-helpers.ts
 * Purpose: Shared builders for the search node tests: planned queries, a state with an app, and Tavily replies.
 * Exports: planned, state, ok, urlsOf
 * Used by: agent/nodes/search*.test.ts
 */
import { defaultQueries } from "../agent/queries.js";
import { makeState } from "./graph-harness.js";
import { APP, hit } from "./node-fixtures.js";

export const planned = defaultQueries("Acme");

export const state = (extra: Partial<Parameters<typeof makeState>[0]> = {}) =>
  makeState({ app: APP, queries: planned, ...extra });

/** A Tavily reply with a hit for each URL. */
export const ok = (...urls: string[]) => ({
  hits: urls.map((url) => hit(url)),
  credits: 1,
});

export const urlsOf = (update: { searchResults?: unknown }) =>
  (update.searchResults as { url: string }[]).map((r) => r.url);
