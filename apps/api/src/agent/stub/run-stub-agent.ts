/**
 * File: run-stub-agent.ts
 * Purpose: Stub agent: plays a scripted event plan with short delays, then saves a marked live guide.
 * Exports: runStubAgent
 * Used by: agent/run-agent.ts
 */
import { STAGES, type Guide, type StageId } from "@stamp/schema";
import {
  LIVE_GUIDE_TTL_MS,
  saveLiveGuide,
  type SaveGuideResult,
} from "../../services/guide-save.js";
import { sleep } from "../../utils/sleep.js";
import type { AgentEvent, AgentOutcome, RunAgentInput } from "../run-agent.js";
import { buildPlan, type StageScript } from "./script.js";

const MIN_DELAY_MS = 150;
const MAX_DELAY_MS = 400;

function delayMs(): number {
  return (
    MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1))
  );
}

function stageName(stage: StageId): string {
  return (
    STAGES.find((definition) => definition.id === stage)?.name ??
    `stage_${stage}`
  );
}

/** Waits a short random delay, then emits; false means the run was aborted and nothing was emitted. */
async function beat(
  input: RunAgentInput,
  make: () => AgentEvent,
): Promise<boolean> {
  await sleep(delayMs(), input.signal);
  if (input.signal.aborted) {
    return false;
  }
  await input.emit(make());
  return true;
}

type StageOptions = {
  /** Runs after the stage's events and before stage.done (stage 8 saves the guide here). */
  action?: () => Promise<void>;
  /** The failing stage starts and emits what it found, but never emits stage.done. */
  endsRun?: boolean;
};

/** Emits stage.started, the stage's events, an optional action, then stage.done; false means aborted. */
async function playStage(
  input: RunAgentInput,
  script: StageScript,
  options: StageOptions = {},
): Promise<boolean> {
  const { runId } = input;
  const startedAt = Date.now();
  const started = (): AgentEvent => ({
    type: "stage.started",
    runId,
    stage: script.stage,
    name: stageName(script.stage),
  });
  if (!(await beat(input, started))) {
    return false;
  }
  for (const event of script.events) {
    if (!(await beat(input, () => event))) {
      return false;
    }
  }
  if (options.endsRun) {
    return true;
  }
  await options.action?.();
  return beat(input, () => ({
    type: "stage.done",
    runId,
    stage: script.stage,
    durationMs: Date.now() - startedAt,
  }));
}

function aborted(stage: number): AgentOutcome {
  return {
    ok: false,
    failure: {
      stage,
      code: "INTERNAL",
      message: "Stub scenario: the run was aborted.",
    },
  };
}

/**
 * Saves the guide so it is born expired: readable at /g/<slug> but never a cache hit,
 * so a stub can never stand in for real research of the same app.
 */
function saveStubGuide(guide: Guide): Promise<SaveGuideResult> {
  return saveLiveGuide(guide, new Date(Date.now() - LIVE_GUIDE_TTL_MS));
}

/** The stub agent: same contract as the real one, scripted events, no network and no model calls. */
export async function runStubAgent(
  input: RunAgentInput,
): Promise<AgentOutcome> {
  const plan = buildPlan(input.runId, input.slug, new Date());
  let ownsSlug = true;
  const save =
    plan.kind === "guide"
      ? async (): Promise<void> => {
          ownsSlug = (await saveStubGuide(plan.guide)).saved;
        }
      : undefined;

  for (const script of plan.stages) {
    const action = script.stage === 8 ? save : undefined;
    if (!(await playStage(input, script, { action }))) {
      return aborted(script.stage);
    }
  }

  if (plan.kind === "failure") {
    const reachedFailure = await playStage(input, plan.failing, {
      endsRun: true,
    });
    return reachedFailure
      ? { ok: false, failure: plan.failure }
      : aborted(plan.failing.stage);
  }
  // A library guide that owns the slug is never overwritten; the run points at it as done.
  return {
    ok: true,
    slug: input.slug,
    status: ownsSlug ? plan.status : "done",
  };
}
