/**
 * File: run-view.ts
 * Purpose: Pure function that turns the events of a run into what the Live run page shows: the state of each
 *          stage, the trace rows, the counts and the outcome. The real stream hook will reuse it unchanged.
 * Exports: StageStatus, StageView, TraceItem, RunOutcome, RunView, deriveRunView
 * Used by: components/run/*, hooks/useMockPlayback.ts consumers (RunScreen)
 */
import type { RunErrorCode, RunEvent, SourceTier } from "@/mocks/types";
import { RUN_STAGES, type StageKind } from "./run-stages";

export type StageStatus =
  "waiting" | "running" | "done" | "stopped" | "not-run";

export type StageView = {
  stage: number;
  name: string;
  kind: StageKind;
  status: StageStatus;
  durationMs: number | null;
};

export type TraceItem =
  | { id: number; type: "stage-started"; name: string }
  | { id: number; type: "stage-done"; name: string; durationMs: number }
  | { id: number; type: "search"; query: string }
  | { id: number; type: "page"; url: string; tier: SourceTier }
  | { id: number; type: "kept"; claimId: string; url: string }
  | { id: number; type: "downgraded"; claimId: string; reason: string };

export type RunOutcome =
  | { kind: "running" }
  | { kind: "done"; slug: string; status: "done" | "partial" }
  | { kind: "error"; stage: number; code: RunErrorCode };

export type RunView = {
  stages: StageView[];
  /** Oldest first. */
  trace: TraceItem[];
  currentStage: StageView | null;
  pagesRead: number;
  claimsKept: number;
  claimsDowngraded: number;
  retries: number;
  outcome: RunOutcome;
};

const RETRY_STAGE = 2; // A retry sends the run back to Search (docs/agent-architecture.md).

function stageName(stage: number): string {
  return (
    RUN_STAGES.find((item) => item.stage === stage)?.name ?? `Stage ${stage}`
  );
}

function toTraceItem(event: RunEvent, id: number): TraceItem | null {
  switch (event.type) {
    case "stage.started":
      return { id, type: "stage-started", name: stageName(event.stage) };
    case "stage.done":
      return {
        id,
        type: "stage-done",
        name: stageName(event.stage),
        durationMs: event.durationMs,
      };
    case "search.query":
      return { id, type: "search", query: event.query };
    case "page.fetched":
      return { id, type: "page", url: event.url, tier: event.tier };
    case "claim.verified":
      return { id, type: "kept", claimId: event.claimId, url: event.url };
    case "claim.downgraded":
      return {
        id,
        type: "downgraded",
        claimId: event.claimId,
        reason: event.reason,
      };
    case "run.done":
    case "run.error":
      return null;
  }
}

function findOutcome(events: readonly RunEvent[]): RunOutcome {
  for (const event of events) {
    if (event.type === "run.done") {
      return { kind: "done", slug: event.slug, status: event.status };
    }
    if (event.type === "run.error") {
      return { kind: "error", stage: event.stage, code: event.code };
    }
  }
  return { kind: "running" };
}

/**
 * A started stage that never finished is Running while the run is live and it is the newest stage,
 * and Stopped otherwise (an error, or a later stage ran, as when a timeout skips to Save).
 */
function buildStages(
  events: readonly RunEvent[],
  outcome: RunOutcome,
): StageView[] {
  const started = new Set<number>();
  const durations = new Map<number, number>();
  for (const event of events) {
    if (event.type === "stage.started") started.add(event.stage);
    if (event.type === "stage.done")
      durations.set(event.stage, event.durationMs);
  }
  const newest = Math.max(-1, ...started);

  return RUN_STAGES.map((item) => {
    const durationMs = durations.get(item.stage) ?? null;
    let status: StageStatus;
    if (durationMs !== null) status = "done";
    else if (started.has(item.stage)) {
      status =
        outcome.kind === "running" && item.stage === newest
          ? "running"
          : "stopped";
    } else status = outcome.kind === "running" ? "waiting" : "not-run";
    return { ...item, status, durationMs };
  });
}

export function deriveRunView(events: readonly RunEvent[]): RunView {
  const outcome = findOutcome(events);
  const stages = buildStages(events, outcome);
  const trace = events.flatMap((event, index) => {
    const item = toTraceItem(event, index);
    return item ? [item] : [];
  });
  const count = (type: RunEvent["type"]): number =>
    events.filter((event) => event.type === type).length;
  const retryStarts = events.filter(
    (event) => event.type === "stage.started" && event.stage === RETRY_STAGE,
  ).length;

  return {
    stages,
    trace,
    currentStage: stages.find((stage) => stage.status === "running") ?? null,
    pagesRead: count("page.fetched"),
    claimsKept: count("claim.verified"),
    claimsDowngraded: count("claim.downgraded"),
    retries: Math.max(0, retryStarts - 1),
    outcome,
  };
}
