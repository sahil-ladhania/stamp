/**
 * File: run-executor.ts
 * Purpose: Runs the agent detached from the HTTP request, publishes its events and always releases the lock.
 * Exports: launchRun
 * Used by: services/runs.ts
 */
import type { RunStreamEvent } from "@stamp/schema";
import {
  runAgent,
  type AgentEvent,
  type AgentOutcome,
} from "../agent/run-agent.js";
import type { AgentFailure } from "../agent/agent-failure.js";
import { RUN_BUDGET } from "../agent/budget.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { withTimeout } from "../utils/with-timeout.js";
import { openRunChannel, publishRunEvent } from "./run-events.js";
import { finishRun, recordStageReached, type RunResult } from "./run-lock.js";
import { RUN_ERROR_MESSAGES } from "./run-messages.js";

/** Backstop beyond the agent's own 120 s budget; the stale-lock window (3 min) stays larger. */
const HARD_TIMEOUT_GRACE_MS = 15_000;

type LaunchedRun = { id: string; slug: string; app: string };
type RunState = { stageReached: number | null };

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function errorEvent(runId: string, failure: AgentFailure): RunStreamEvent {
  return {
    type: "run.error",
    runId,
    stage: failure.stage,
    code: failure.code,
    message: failure.message,
    ...(failure.options ? { options: failure.options } : {}),
  };
}

/** Writes the outcome and frees the lock; a database failure is logged and never blocks the stream's end. */
async function recordResult(runId: string, result: RunResult): Promise<void> {
  try {
    await finishRun(runId, result);
  } catch (err) {
    logger.error("could not record run result", {
      runId,
      detail: errorText(err),
    });
  }
}

async function settleFailure(
  run: LaunchedRun,
  failure: AgentFailure,
  state: RunState,
): Promise<RunStreamEvent> {
  await recordResult(run.id, {
    status: "failed",
    stageReached: failure.stage ?? state.stageReached,
    errorCode: failure.code,
  });
  return errorEvent(run.id, failure);
}

async function settleOutcome(
  run: LaunchedRun,
  outcome: AgentOutcome,
  state: RunState,
): Promise<RunStreamEvent> {
  if (!outcome.ok) {
    return settleFailure(run, outcome.failure, state);
  }
  const guide = await prisma.guide.findUnique({
    where: { slug: outcome.slug },
    select: { id: true },
  });
  if (!guide) {
    logger.error("agent reported a guide that is not stored", {
      runId: run.id,
      slug: outcome.slug,
    });
    return settleFailure(
      run,
      {
        stage: state.stageReached ?? 0,
        code: "INTERNAL",
        message: RUN_ERROR_MESSAGES.INTERNAL,
      },
      state,
    );
  }
  await recordResult(run.id, {
    status: outcome.status,
    stageReached: state.stageReached,
    guideId: guide.id,
  });
  return {
    type: "run.done",
    runId: run.id,
    slug: outcome.slug,
    status: outcome.status,
  };
}

async function executeRun(run: LaunchedRun): Promise<void> {
  const state: RunState = { stageReached: null };
  const controller = new AbortController();
  const emit = async (event: AgentEvent): Promise<void> => {
    if (controller.signal.aborted) {
      return;
    }
    if (event.type === "stage.started") {
      state.stageReached = event.stage;
      await recordStageReached(run.id, event.stage);
    }
    publishRunEvent(run.id, event);
  };

  let terminal: RunStreamEvent;
  try {
    const outcome = await withTimeout(
      runAgent({
        runId: run.id,
        app: run.app,
        slug: run.slug,
        emit,
        signal: controller.signal,
      }),
      RUN_BUDGET.maxDurationMs + HARD_TIMEOUT_GRACE_MS,
      "Run",
    );
    terminal = await settleOutcome(run, outcome, state);
  } catch (err) {
    controller.abort();
    logger.error("run failed", { runId: run.id, detail: errorText(err) });
    terminal = await settleFailure(
      run,
      {
        stage: state.stageReached ?? 0,
        code: "INTERNAL",
        message: RUN_ERROR_MESSAGES.INTERNAL,
      },
      state,
    );
  }
  publishRunEvent(run.id, terminal);
}

/** Starts the agent in the background and returns at once; the stream endpoint reads its events. */
export function launchRun(run: LaunchedRun): void {
  openRunChannel(run.id);
  executeRun(run).catch((err: unknown) => {
    logger.error("run executor crashed", {
      runId: run.id,
      detail: errorText(err),
    });
  });
}
