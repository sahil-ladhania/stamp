/**
 * File: fetch.ts
 * Purpose: Stage 3: reads the best pages (4 on the first pass, the rest of 6 on the retry), reusing cached ones. Needs one official page.
 * Exports: fetchNode
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import { recordPages } from "../../lib/usage.js";
import { makeFailure } from "../agent-failure.js";
import { pageAllowance } from "../budget.js";
import { getDeps } from "../deps.js";
import { emit } from "../emit.js";
import { loadPages } from "../fetch/load-pages.js";
import { selectPages } from "../fetch/select-pages.js";
import { callTimeoutMs } from "../node-timing.js";
import { stageNode } from "../stage-node.js";

export const fetchNode = stageNode("fetch", async (state, config) => {
  const { app } = state;
  if (!app) {
    return { failure: makeFailure(3, "INTERNAL") };
  }
  const deps = getDeps(config);
  // Search has already counted the retry, so a retry pass shows as retryCount 1 here.
  const retryPass = state.retryCount > 0;
  const picks = selectPages(state.searchResults, {
    allowance: pageAllowance(state.pages.length, retryPass),
    held: new Set(state.pages.map((page) => page.urlHash)),
    product: app.product,
  });
  const loaded = await loadPages(
    picks.map((pick) => pick.url),
    {
      domains: app.domains,
      timeoutMs: callTimeoutMs(config, "fetch", { retryPass }),
      signal: config.signal,
      usage: deps.usage,
      runId: deps.runId,
      cache: deps.pageCache,
    },
  );

  for (const page of loaded.pages) {
    await emit(config, {
      type: "page.fetched",
      url: page.url,
      tier: page.tier,
    });
  }
  recordPages(deps.usage, {
    fetched: loaded.fetched,
    cacheHits: loaded.cacheHits,
  });
  logger.info("pages loaded", {
    runId: deps.runId,
    requested: picks.length,
    cacheHits: loaded.cacheHits,
    fetched: loaded.fetched,
    dropped: loaded.dropped,
    failed: loaded.failed,
  });

  const held = [...state.pages, ...loaded.pages];
  if (!held.some((page) => page.tier === "official")) {
    // A failed extract call is our problem, not proof the app has no docs.
    const lookedOnly = held.length === 0 && loaded.extractError !== null;
    return {
      pages: loaded.pages,
      failure: makeFailure(3, lookedOnly ? "INTERNAL" : "NO_PUBLIC_DOCS"),
    };
  }
  return { pages: loaded.pages };
});
