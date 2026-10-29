/**
 * File: run-view.ts
 * Purpose: Pure function that turns the events of a run into what the Live run page shows: the state of each
 *          stage, the counts and the outcome. Reads events in order, so a retry pass (the run goes back to
 *          Search once) shows as running again instead of staying "done". The trace is grouped by stage in run-groups.ts.
 * Exports: StageStatus, StageView, RunOutcome, RunView, RunViewEvent, deriveRunView
 * Used by: components/run/*, hooks/useRunStream.ts, hooks/useRunClock.ts
 */
import type {
  AppCandidate,
  RunErrorCode,
  RunStreamEvent,
} from "@stamp/schema";
import { RUN_STAGES, type StageKind } from "./run-stages";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** A progress event as the view reads it: no snapshot (the hook keeps that) and no run id (one run per page). */
export type RunViewEvent = DistributiveOmit<
  Exclude<RunStreamEvent, { type: "run.snapshot" }>,
  "runId"
>;

export type StageStatus =
  "waiting" | "running" | "done" | "stopped" | "not-run";

export type StageView = {
  stage: number;
  name: string;
  kind: StageKind;
  status: StageStatus;
  durationMs: number | null;
};

export type RunOutcome =
  | { kind: "running" }
  | { kind: "done"; slug: string; status: "done" | "partial" }
  | {
      kind: "error";
      stage: number;
      code: RunErrorCode;
      message: string;
      /** The apps to choose from when the code is AMBIGUOUS_APP; empty otherwise. */
      options: AppCandidate[];
    };

export type RunView = {
  stages: StageView[];
  currentStage: StageView | null;
  pagesRead: number;
  claimsKept: number;
  claimsDowngraded: number;
  retries: number;
  outcome: RunOutcome;
  /** What the run said it is researching (the resolve stage); null before it does. */
  researched: { appName: string; domain: string; product: string | null } | null;
};

const RETRY_STAGE = 2; // A retry sends the run back to Search (docs/agent-architecture.md).

function findOutcome(events: readonly RunViewEvent[]): RunOutcome {
  for (const event of events) {
    if (event.type === "run.done") {
      return { kind: "done", slug: event.slug, status: event.status };
    }
    if (event.type === "run.error") {
      return {
        kind: "error",
        stage: event.stage,
        code: event.code,
        message: event.message,
        options: event.options ?? [],
      };
    }
  }
  return { kind: "running" };
}

type StageProgress = { status: "running" | "done"; durationMs: number | null };

/** Replays the stage events in order. Starting a stage again sends every later stage back to waiting. */
function trackStages(
  events: readonly RunViewEvent[],
): Map<number, StageProgress> {
  const progress = new Map<number, StageProgress>();
  for (const event of events) {
    if (event.type === "stage.started") {
      if (progress.has(event.stage)) {
        for (const stage of [...progress.keys()]) {
          if (stage > event.stage) progress.delete(stage);
        }
      }
      progress.set(event.stage, { status: "running", durationMs: null });
    }
    if (event.type === "stage.done") {
      progress.set(event.stage, { status: "done", durationMs: event.durationMs });
    }
  }
  return progress;
}

/**
 * A started stage that never finished is Running while the run is live and it is the newest stage,
 * and Stopped otherwise (an error, or a later stage ran, as when a timeout skips to Save).
 */
function buildStages(
  events: readonly RunViewEvent[],
  outcome: RunOutcome,
): StageView[] {
  const progress = trackStages(events);
  const newest = Math.max(-1, ...progress.keys());

  return RUN_STAGES.map((item) => {
    const entry = progress.get(item.stage);
    let status: StageStatus;
    if (entry?.status === "done") status = "done";
    else if (entry) {
      status =
        outcome.kind === "running" && item.stage === newest
          ? "running"
          : "stopped";
    } else status = outcome.kind === "running" ? "waiting" : "not-run";
    return { ...item, status, durationMs: entry?.durationMs ?? null };
  });
}

function findResearched(events: readonly RunViewEvent[]): RunView["researched"] {
  for (const event of [...events].reverse()) {
    if (event.type === "app.resolved") {
      return { appName: event.appName, domain: event.domain, product: event.product };
    }
  }
  return null;
}

export function deriveRunView(events: readonly RunViewEvent[]): RunView {
  const outcome = findOutcome(events);
  const stages = buildStages(events, outcome);
  const count = (type: RunViewEvent["type"]): number =>
    events.filter((event) => event.type === type).length;
  const retryStarts = events.filter(
    (event) => event.type === "stage.started" && event.stage === RETRY_STAGE,
  ).length;

  return {
    stages,
    currentStage: stages.find((stage) => stage.status === "running") ?? null,
    pagesRead: count("page.fetched"),
    claimsKept: count("claim.verified"),
    claimsDowngraded: count("claim.downgraded"),
    retries: Math.max(0, retryStarts - 1),
    outcome,
    researched: findResearched(events),
  };
}
