/**
 * File: score.ts
 * Purpose: Stage 7: applies the difficulty rule and classifies the archetype from the verified gates, in code only. A run stopped before verify scores as unknown.
 * Exports: scoreNode
 * Used by: agent/nodes/index.ts
 */
import { stageOf } from "../pipeline.js";
import { classifyArchetype } from "../scoring/archetype.js";
import { scoreDifficulty } from "../scoring/difficulty.js";
import { toGateFacts } from "../scoring/gate-facts.js";
import { stageNode } from "../stage-node.js";

const VERIFY_STAGE = stageOf("verify");

/**
 * Gates count only after verify checked their quotes. When the budget skipped verify, the gates are
 * the model's unchecked claims, so they score as unknown (the wait counts 2, no gate is assumed).
 */
export const scoreNode = stageNode("score", (state) => {
  const checked = state.completed.includes(VERIFY_STAGE);
  const facts = toGateFacts(checked ? state.gates : null);
  return Promise.resolve({
    difficulty: scoreDifficulty(facts),
    archetype: classifyArchetype(facts),
  });
});
