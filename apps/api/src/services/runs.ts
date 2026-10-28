/**
 * File: runs.ts
 * Purpose: Run lifecycle, cache lookup, and stream event source.
 * Exports: startRun, getRunById, openRunStream
 * Used by: controllers/runs.ts, agent graph (later)
 */
import type {
  RunSnapshot,
  RunStreamEvent,
  StartRunInput,
  StartRunResult,
} from "@stamp/schema";
import { InternalError } from "../errors/app-error.js";

/** Returns cached slug or starts/joins a live run. */
export async function startRun(_input: StartRunInput): Promise<StartRunResult> {
  throw new InternalError();
}

/** Loads a run snapshot by id. */
export async function getRunById(_runId: string): Promise<RunSnapshot> {
  throw new InternalError();
}

/** Yields SSE events for an active or completed run. */
// eslint-disable-next-line require-yield -- stub until the runs API lands (Phase 4)
export async function* openRunStream(
  _runId: string,
): AsyncGenerator<RunStreamEvent> {
  throw new InternalError();
}
