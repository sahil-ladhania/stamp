/**
 * File: run-agent.ts
 * Purpose: The seam between the runs service and the research agent: input, outcome and entry point.
 * Exports: runAgent, RunAgentInput, AgentOutcome, AgentEvent
 * Used by: services/run-executor.ts
 */
import type { RunStreamEvent } from "@stamp/schema";
import type { AgentFailure } from "./agent-failure.js";

/** Progress events the agent may emit; the executor sends run.snapshot, run.done and run.error. */
export type AgentEvent = Exclude<
  RunStreamEvent,
  { type: "run.snapshot" | "run.done" | "run.error" }
>;

export type RunAgentInput = {
  runId: string;
  /** What the user typed: an app name or URL. */
  app: string;
  slug: string;
  emit: (event: AgentEvent) => Promise<void>;
  /** Aborts when the executor gives up on the run. */
  signal: AbortSignal;
};

/** The agent saves the guide itself (stage 8) and reports where it went. */
export type AgentOutcome =
  | { ok: true; slug: string; status: "done" | "partial" }
  | { ok: false; failure: AgentFailure };

/** Placeholder until the LangGraph pipeline replaces it: every run ends with an INTERNAL failure. */
export function runAgent(_input: RunAgentInput): Promise<AgentOutcome> {
  return Promise.resolve({
    ok: false,
    failure: {
      stage: 0,
      code: "INTERNAL",
      message: "The research agent is not available yet.",
    },
  });
}
