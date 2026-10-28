/**
 * File: run-real-agent.ts
 * Purpose: Runs the LangGraph pipeline for one run and returns the AgentOutcome the executor expects.
 * Exports: runRealAgent, RealAgentOptions
 * Used by: agent/run-agent.ts when AGENT_MODE is real
 */
import { getConfig } from "../config.js";
import { logger } from "../lib/logger.js";
import { createRunUsage, summarizeUsage } from "../lib/usage.js";
import { errorText } from "../utils/error-text.js";
import { makeFailure } from "./agent-failure.js";
import { startBudget } from "./budget.js";
import type { AgentDeps } from "./deps.js";
import { buildGraph, RECURSION_LIMIT } from "./graph.js";
import { defaultNodes } from "./nodes/index.js";
import { isPartial } from "./pipeline.js";
import type { AgentOutcome, RunAgentInput } from "./run-agent.js";
import type { NodeSet } from "./stage-node.js";
import type { State } from "./state.js";

export type RealAgentOptions = {
  /** Replaces default nodes: tests, and the steps that fill the stages in. */
  nodes?: Partial<NodeSet>;
  /** Clock in milliseconds; tests inject a fake one. */
  now?: () => number;
  /** Lowers the 120 s budget; defaults to AGENT_RUN_BUDGET_MS. */
  budgetMs?: number;
  /** Parallel extraction calls; defaults to AGENT_EXTRACT_CONCURRENCY. */
  extractConcurrency?: number;
  /** Whether the probe may send its one request; defaults to AGENT_PROBE being "on". */
  probeEnabled?: boolean;
};

function internal(stage: number): AgentOutcome {
  return { ok: false, failure: makeFailure(stage, "INTERNAL") };
}

/** A failure ends the run; otherwise the run is done only if a guide was saved. */
function toOutcome(state: State, slug: string, runId: string): AgentOutcome {
  if (state.failure) {
    return { ok: false, failure: state.failure };
  }
  if (!state.guide) {
    logger.error("agent finished without a guide", { runId });
    return internal(8);
  }
  // A library guide that owns the slug is shown as the result and counts as done.
  const partial = !state.libraryProtected && isPartial(state);
  return { ok: true, slug, status: partial ? "partial" : "done" };
}

function describeOutcome(outcome: AgentOutcome): Record<string, unknown> {
  return outcome.ok
    ? { ok: true, status: outcome.status }
    : { ok: false, code: outcome.failure.code };
}

/**
 * Runs stages 0 to 8 and reports the result; never throws. A node error or an abort ends the run
 * as an INTERNAL failure at the stage that was running, and the executor turns it into run.error.
 */
export async function runRealAgent(
  input: RunAgentInput,
  options: RealAgentOptions = {},
): Promise<AgentOutcome> {
  const now = options.now ?? Date.now;
  const startedAt = now();
  const usage = createRunUsage();
  let stageReached = 0;
  const deps: AgentDeps = {
    runId: input.runId,
    emit: async (event) => {
      if (event.type === "stage.started") {
        stageReached = event.stage;
      }
      await input.emit(event);
    },
    clock: startBudget(
      startedAt,
      options.budgetMs ?? getConfig().AGENT_RUN_BUDGET_MS,
    ),
    now,
    usage,
    extractConcurrency:
      options.extractConcurrency ?? getConfig().AGENT_EXTRACT_CONCURRENCY,
    probeEnabled: options.probeEnabled ?? getConfig().AGENT_PROBE === "on",
  };

  let outcome: AgentOutcome;
  try {
    const state = await buildGraph({
      ...defaultNodes,
      ...options.nodes,
    }).invoke(
      { typed: input.app, slug: input.slug },
      {
        configurable: { deps },
        signal: input.signal,
        recursionLimit: RECURSION_LIMIT,
      },
    );
    outcome = toOutcome(state, input.slug, input.runId);
  } catch (err) {
    if (!input.signal.aborted) {
      logger.error("agent run failed", {
        runId: input.runId,
        stage: stageReached,
        detail: errorText(err),
      });
    }
    outcome = internal(stageReached);
  }

  logger.info("run summary", {
    runId: input.runId,
    ...describeOutcome(outcome),
    aborted: input.signal.aborted,
    stageReached,
    durationMs: now() - startedAt,
    ...summarizeUsage(usage),
  });
  return outcome;
}
