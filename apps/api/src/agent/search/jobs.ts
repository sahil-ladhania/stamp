/**
 * File: jobs.ts
 * Purpose: Decides which searches the search stage runs: all topics on the official domain plus two open ones, or targeted retries.
 * Exports: buildJobs, SearchJob
 * Used by: agent/nodes/search.ts
 */
import {
  OPEN_TOPICS,
  defaultQueries,
  retryQueries,
  type PlannedQuery,
} from "../queries.js";

export type SearchJob = {
  query: string;
  /** Empty means the whole web. */
  includeDomains: string[];
};

/**
 * First pass: every planned query on the official domain, then the open-topic queries across the web, so
 * official pages come first. Retry pass (verify reported missing sections): fresh wording for those
 * sections, official domain only.
 */
export function buildJobs(
  app: { appName: string; domain: string },
  queries: PlannedQuery[],
  missingSections: string[],
): SearchJob[] {
  if (missingSections.length > 0) {
    return retryQueries(app.appName, missingSections).map((q) => ({
      query: q.text,
      includeDomains: [app.domain],
    }));
  }
  const planned = queries.length > 0 ? queries : defaultQueries(app.appName);
  return [
    ...planned.map((q) => ({ query: q.text, includeDomains: [app.domain] })),
    ...planned
      .filter((q) => OPEN_TOPICS.includes(q.topic))
      .map((q) => ({ query: q.text, includeDomains: [] })),
  ];
}
