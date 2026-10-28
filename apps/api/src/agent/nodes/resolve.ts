/**
 * File: resolve.ts
 * Purpose: Stage 0: turns the typed app name or URL into one official domain, or ends the run asking "did you mean".
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
import { rankCandidates } from "../resolve/candidates.js";
import { decideOfficial } from "../resolve/decide.js";
import { parseTyped } from "../resolve/typed-input.js";
import { stageNode } from "../stage-node.js";

export const RESOLVE_MAX_RESULTS = 8;

/** The one search that finds an app's official site from its name. */
export const RESOLVE_QUERY = (name: string): string =>
  `${name} API developer documentation`;

export const resolveNode = stageNode("resolve", async (state, config) => {
  const typed = parseTyped(state.typed);
  if (typed.kind === "domain") {
    // A typed domain or URL names the official site; no search and no "did you mean".
    return {
      app: { appName: typed.name, domain: typed.domain, slug: state.slug },
    };
  }
  if (typed.name === "") {
    return { failure: makeFailure(0, "NO_PUBLIC_DOCS") };
  }

  const deps = getDeps(config);
  const query = RESOLVE_QUERY(typed.name);
  await emit(config, { type: "search.query", query });
  let hits;
  try {
    ({ hits } = await searchWeb(query, {
      timeoutMs: callTimeoutMs(config, "resolve"),
      maxResults: RESOLVE_MAX_RESULTS,
      signal: config.signal,
      usage: deps.usage,
      runId: deps.runId,
    }));
  } catch (err) {
    config.signal?.throwIfAborted();
    logger.error("resolve search failed", {
      runId: deps.runId,
      detail: errorText(err),
    });
    return { failure: makeFailure(0, "INTERNAL") };
  }

  const decision = decideOfficial(rankCandidates(typed.name, hits));
  switch (decision.kind) {
    case "official":
      return {
        app: { appName: typed.name, domain: decision.domain, slug: state.slug },
      };
    case "ambiguous":
      return { failure: makeFailure(0, "AMBIGUOUS_APP", decision.options) };
    case "none":
      return { failure: makeFailure(0, "NO_PUBLIC_DOCS") };
  }
});
