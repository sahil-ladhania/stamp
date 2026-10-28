/**
 * File: extract.ts
 * Purpose: Stage 4: extracts every guide section with the strong model (a few at a time), then the verdict; may end the run with NOT_OAUTH or NO_PUBLIC_DOCS.
 * Exports: extractNode
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import { mapLimit } from "../../utils/map-limit.js";
import { makeFailure } from "../agent-failure.js";
import { getDeps } from "../deps.js";
import { endOfExtract, retrySections } from "../extract/decisions.js";
import { collectResults, logRows } from "../extract/results.js";
import { runSection } from "../extract/run-section.js";
import { indexPages } from "../extract/sanitize.js";
import type {
  SectionContext,
  SectionResult,
} from "../extract/section-types.js";
import { FIRST_WAVE, type SectionId } from "../extract/sections.js";
import { verdictContext } from "../extract/verdict-context.js";
import { callTimeoutMs } from "../node-timing.js";
import { stageNode } from "../stage-node.js";

export const extractNode = stageNode("extract", async (state, config) => {
  const { app, pages } = state;
  if (!app || pages.length === 0) {
    return { failure: makeFailure(4, "INTERNAL") };
  }
  const deps = getDeps(config);
  const retryPass = state.retryCount > 0;
  // A retry pass redoes only the sections verify reported (and the verdict if it points into them).
  const plan = retryPass
    ? retrySections(state.missingSections)
    : { sections: FIRST_WAVE, redoVerdict: true };
  if (plan.sections.length === 0 && !plan.redoVerdict) {
    return {};
  }

  const startedAt = deps.now();
  const base: SectionContext = {
    runId: deps.runId,
    app,
    pages,
    index: indexPages(pages),
    signal: config.signal,
    usage: deps.usage,
    now: deps.now,
    deadline: startedAt + callTimeoutMs(config, "extract", { retryPass }),
  };
  const results: SectionResult<SectionId>[] = await mapLimit(
    plan.sections,
    deps.extractConcurrency,
    (section) => runSection(section, base),
    config.signal,
  );
  if (plan.redoVerdict) {
    // The verdict picks steps and blockers by position, so it runs after them.
    const merged = { ...state.drafts, ...collectResults(results).drafts };
    results.push(
      await runSection("verdict", { ...base, ...verdictContext(merged) }),
    );
  }

  const collected = collectResults(results);
  const gates = collected.gates === undefined ? state.gates : collected.gates;
  const failure = endOfExtract(
    gates,
    { ...state.drafts, ...collected.drafts },
    pages,
  );
  logger.info("extract summary", {
    runId: deps.runId,
    retryPass,
    concurrency: deps.extractConcurrency,
    windowMs: base.deadline - startedAt,
    durationMs: deps.now() - startedAt,
    sections: logRows(results),
  });
  return {
    drafts: collected.drafts,
    ...(collected.gates === undefined ? {} : { gates: collected.gates }),
    ...(collected.partial ? { partial: true } : {}),
    ...(failure ? { failure } : {}),
  };
});
