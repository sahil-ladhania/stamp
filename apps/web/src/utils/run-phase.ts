/**
 * File: run-phase.ts
 * Purpose: The one state the Live run page is in, from the outcome of the events, the stream failure and the connection:
 *          what the status pill says and which layout shows. A terminal event wins over a stream failure that follows it.
 * Exports: RunPhase, getRunPhase
 * Used by: components/run/RunScreen.tsx, components/run/RunStatusPill.tsx
 */
import type { ApiError } from "@/lib/api-error";
import type { RunStreamStatus } from "@/services/run-stream.service";
import type { RunOutcome } from "./run-view";

export type RunPhase = "connecting" | "running" | "done" | "partial" | "stopped" | "disconnected" | "not-found";

type PhaseInput = {
  outcome: RunOutcome;
  error: Pick<ApiError, "code"> | null;
  connection: RunStreamStatus;
  hasEvents: boolean;
};

export function getRunPhase({ outcome, error, connection, hasEvents }: PhaseInput): RunPhase {
  if (outcome.kind === "done") return outcome.status;
  if (outcome.kind === "error") return "stopped";
  if (error) return error.code === "NOT_FOUND" ? "not-found" : "disconnected";
  return connection === "connecting" && !hasEvents ? "connecting" : "running";
}
