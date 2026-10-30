/**
 * File: resolve.ts
 * Purpose: Stage 0: turns the typed app name or URL into the official app (its domains and product phrase) and says what it will research, or ends the run asking "did you mean".
 * Exports: resolveNode, RESOLVE_QUERY, RESOLVE_MAX_RESULTS
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import { searchWeb } from "../../lib/tavily.js";
import { errorText } from "../../utils/error-text.js";
import { makeFailure } from "../agent-failure.js";
import { getDeps } from "../deps.js";
import { emit } from "../emit.js";
import { callTimeoutMs } from "../node-timing.js";
import {
  RESOLVE_MAX_RESULTS,
  RESOLVE_QUERY,
  resolveWithSearch,
} from "../resolve/resolve-search.js";
import { parseTyped } from "../resolve/typed-input.js";
import { stageNode } from "../stage-node.js";

export { RESOLVE_MAX_RESULTS, RESOLVE_QUERY };

/** A retry or a second look gets at most this long, so a thin first answer cannot use up the run's time. */
const AGAIN_TIMEOUT_MS = 3_000;

export const resolveNode = stageNode("resolve", async (state, config) => {
  const typed = parseTyped(state.typed);
  if (typed.kind === "domain") {
    // A typed domain or URL names the official site; no search and no "did you mean".
    await emit(config, {
      type: "app.resolved",
      appName: typed.name,
      domain: typed.domain,
      product: null,
    });
    return {
      app: {
        appName: typed.name,
        domain: typed.domain,
        slug: state.slug,
        domains: [typed.domain],
        product: null,
      },
    };
  }
  if (typed.name === "") {
    return { failure: makeFailure(0, "NO_PUBLIC_DOCS") };
  }

  const deps = getDeps(config);
  const emitted = new Set<string>();
  let searched;
  try {
    searched = await resolveWithSearch(
      typed.name,
      async (query, attempt) => {
        if (!emitted.has(query)) {
          emitted.add(query);
          await emit(config, { type: "search.query", query });
        }
        const room = callTimeoutMs(config, "resolve");
        return searchWeb(query, {
          timeoutMs:
            attempt === "first" ? room : Math.min(room, AGAIN_TIMEOUT_MS),
          maxResults: RESOLVE_MAX_RESULTS,
          signal: config.signal,
          usage: deps.usage,
          runId: deps.runId,
        });
      },
      () => !config.signal?.aborted,
    );
  } catch (err) {
    config.signal?.throwIfAborted();
    logger.error("resolve search failed", {
      runId: deps.runId,
      detail: errorText(err),
    });
    return { failure: makeFailure(0, "INTERNAL") };
  }

  const { hits, candidates, decision, identity } = searched;
  // The scores are what the ambiguity thresholds are tuned against; no page text is logged.
  logger.info("resolve summary", {
    runId: deps.runId,
    name: typed.name,
    decision: decision.kind,
    hits: hits.length,
    // How many searches it took: a retry after a failed search, and a second look at a thin first answer.
    queries: searched.queries,
    retried: searched.retried,
    lookedAgain: searched.lookedAgain,
    // URLs and titles only, no page text: what the resolve decision was made from, for tuning and for eval fixtures.
    resolveHits: hits.map(({ url, title }) => ({ url, title })),
    // What the search and the tiering will use: the official domains and the product phrase, or null.
    identity,
    candidates: candidates.slice(0, 5).map((c) => ({
      domain: c.domain,
      match: c.match,
      score: Math.round(c.score * 100) / 100,
      hits: c.hits,
    })),
  });
  switch (decision.kind) {
    case "official": {
      const domains = identity?.domains ?? [decision.domain];
      const product = identity?.product ?? null;
      await emit(config, {
        type: "app.resolved",
        appName: typed.name,
        domain: decision.domain,
        product,
      });
      return {
        app: {
          appName: typed.name,
          domain: decision.domain,
          slug: state.slug,
          domains,
          product,
        },
      };
    }
    case "ambiguous":
      return { failure: makeFailure(0, "AMBIGUOUS_APP", decision.options) };
    case "none":
      return { failure: makeFailure(0, "NO_PUBLIC_DOCS") };
  }
});
