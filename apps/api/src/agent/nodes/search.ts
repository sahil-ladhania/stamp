/**
 * File: search.ts
 * Purpose: Stage 2: runs the planned searches (official domain first, then two open ones), or targeted ones on the retry pass.
 * Exports: searchNode, SEARCH_CONCURRENCY, SEARCH_MAX_RESULTS
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import { searchWeb, type SearchHit } from "../../lib/tavily.js";
import { errorText } from "../../utils/error-text.js";
import { mapLimit } from "../../utils/map-limit.js";
import { makeFailure } from "../agent-failure.js";
import { getDeps } from "../deps.js";
import { emit } from "../emit.js";
import { MIN_CALL_MS, callTimeoutMs } from "../node-timing.js";
import { isRetryEntry } from "../routes.js";
import { buildJobs, type SearchJob } from "../search/jobs.js";
import { orderResults, toSearchResults } from "../search/order-results.js";
import { stageNode } from "../stage-node.js";

export const SEARCH_CONCURRENCY = 4;
export const SEARCH_MAX_RESULTS = 5;

export const searchNode = stageNode("search", async (state, config) => {
  const { app } = state;
  if (!app) {
    return { failure: makeFailure(2, "INTERNAL") };
  }
  const deps = getDeps(config);
  const jobs = buildJobs(app, state.queries, state.missingSections);
  for (const query of new Set(jobs.map((job) => job.query))) {
    await emit(config, { type: "search.query", query });
  }

  // All searches share the node's time window: a search that cannot start with time left is skipped.
  const deadline =
    deps.now() +
    callTimeoutMs(config, "search", { retryPass: isRetryEntry(state) });
  const run = async (job: SearchJob): Promise<SearchHit[] | null> => {
    const timeoutMs = deadline - deps.now();
    if (timeoutMs < MIN_CALL_MS) {
      return null;
    }
    try {
      const result = await searchWeb(job.query, {
        timeoutMs,
        includeDomains: job.includeDomains,
        maxResults: SEARCH_MAX_RESULTS,
        signal: config.signal,
        usage: deps.usage,
        runId: deps.runId,
      });
      return result.hits;
    } catch (err) {
      config.signal?.throwIfAborted();
      logger.warn("search failed", {
        runId: deps.runId,
        detail: errorText(err),
      });
      return null;
    }
  };
  const runs = await mapLimit(jobs, SEARCH_CONCURRENCY, run, config.signal);

  if (runs.every((hits) => hits === null)) {
    return { failure: makeFailure(2, "INTERNAL") };
  }
  const hits = runs.flatMap((found) => found ?? []);
  return { searchResults: orderResults(toSearchResults(hits, app.domain)) };
});
