/**
 * File: save.ts
 * Purpose: Stage 8: builds the guide from verified claims, checks it against GuideSchema, stores it and writes the verification log. A run with no Sourced claim fails as INTERNAL.
 * Exports: saveNode
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import { saveLiveGuide } from "../../services/guide-save.js";
import { writeVerificationLog } from "../../services/verification-log.js";
import { errorText } from "../../utils/error-text.js";
import { makeFailure } from "../agent-failure.js";
import { getDeps } from "../deps.js";
import { buildGuide } from "../guide/build-guide.js";
import { stageOf } from "../pipeline.js";
import { stageNode } from "../stage-node.js";

const STAGE = stageOf("save");

export const saveNode = stageNode("save", async (state, config) => {
  const { runId, now } = getDeps(config);
  const built = buildGuide(state, new Date(now()));
  if (!built.ok) {
    logger.error("guide not saved", { runId, reason: built.reason });
    return { failure: makeFailure(STAGE, "INTERNAL") };
  }
  const { guide } = built;

  const saved = await saveLiveGuide(guide, new Date(now()));
  if (!saved.saved) {
    // A library guide owns this slug: it is the result, and the live run's checks do not belong to it.
    logger.info("library guide protected", { runId, slug: guide.slug });
    return { guide, libraryProtected: true };
  }
  try {
    await writeVerificationLog({
      slug: guide.slug,
      runId,
      records: state.checks,
    });
  } catch (err) {
    // The guide is stored; a lost audit row must not fail the run.
    logger.warn("verification log not written", {
      runId,
      detail: errorText(err),
    });
  }
  logger.info("guide saved", {
    runId,
    slug: guide.slug,
    coverage: guide.coverage,
    difficulty: guide.difficulty,
    checks: state.checks.length,
  });
  return { guide };
});
