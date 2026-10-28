/**
 * File: plan.ts
 * Purpose: Stage 1: asks the fast model for search queries, checks each one in code and fills gaps from templates. Never fails the run.
 * Exports: planNode
 * Used by: agent/nodes/index.ts
 */
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import { errorText } from "../../utils/error-text.js";
import { makeFailure } from "../agent-failure.js";
import { getDeps } from "../deps.js";
import { callTimeoutMs } from "../node-timing.js";
import { PlanOutputSchema, type PlanOutput } from "../plan-output.js";
import { planMessages } from "../prompts/plan.js";
import { mergePlan } from "../queries.js";
import { stageNode } from "../stage-node.js";

export const planNode = stageNode("plan", async (state, config) => {
  const { app } = state;
  if (!app) {
    return { failure: makeFailure(1, "INTERNAL") };
  }
  const deps = getDeps(config);
  let plan: PlanOutput | null = null;
  try {
    const result = await structured("fast", {
      schema: PlanOutputSchema,
      name: "plan_queries",
      messages: planMessages(app),
      timeoutMs: callTimeoutMs(config, "plan"),
      signal: config.signal,
      usage: deps.usage,
      runId: deps.runId,
    });
    if (result.ok) {
      plan = result.data;
    } else {
      logger.warn("plan reply unusable", {
        runId: deps.runId,
        failure: result.failure,
      });
    }
  } catch (err) {
    config.signal?.throwIfAborted();
    logger.warn("plan call failed", {
      runId: deps.runId,
      detail: errorText(err),
    });
  }
  // Without a usable model reply the run still searches, with the template queries.
  return { queries: mergePlan(app.appName, plan) };
});
