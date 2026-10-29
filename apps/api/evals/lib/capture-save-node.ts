/**
 * File: capture-save-node.ts
 * Purpose: The eval's stage 8: builds the guide exactly as the real save stage does, hands the final state to the capture, and stores nothing, so a batch never overwrites a stored guide.
 * Exports: captureSaveNode
 * Used by: evals/lib/run-one.ts
 */
import { logger } from "../../src/lib/logger.js";
import { makeFailure } from "../../src/agent/agent-failure.js";
import { getDeps } from "../../src/agent/deps.js";
import {
  buildGuide,
  type BuildGuideResult,
} from "../../src/agent/guide/build-guide.js";
import { stageOf } from "../../src/agent/pipeline.js";
import { stageNode, type NodeFn } from "../../src/agent/stage-node.js";
import type { State } from "../../src/agent/state.js";

const STAGE = stageOf("save");

/** `onResult` sees the final state and the build result even when the guide cannot be built, so a failed save still leaves evidence. */
export function captureSaveNode(
  onResult: (state: State, built: BuildGuideResult) => void,
): NodeFn {
  return stageNode("save", (state, config) => {
    const { runId, now } = getDeps(config);
    const built = buildGuide(state, new Date(now()));
    onResult(state, built);
    if (!built.ok) {
      logger.error("guide not saved", { runId, reason: built.reason });
      return Promise.resolve({ failure: makeFailure(STAGE, "INTERNAL") });
    }
    return Promise.resolve({ guide: built.guide });
  });
}
