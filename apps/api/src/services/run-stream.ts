/**
 * File: run-stream.ts
 * Purpose: The event sequence for GET /api/runs/:id/stream: snapshot, buffered events, then live ones.
 * Exports: openRunStream
 * Used by: services/runs.ts, controllers/runs.ts
 */
import type { RunStreamEvent } from "@stamp/schema";
import { sleep } from "../utils/sleep.js";
import {
  getRunChannel,
  isTerminalEvent,
  waitForRunEvent,
  type RunChannel,
} from "./run-events.js";
import { loadRunView, terminalEventFor, type RunView } from "./run-view.js";

const ORPHAN_POLL_MS = 2000;

/** Replays the buffer from the start, then follows new events until the run ends. */
async function* followChannel(
  channel: RunChannel,
  signal?: AbortSignal,
): AsyncGenerator<RunStreamEvent> {
  let next = 0;
  while (!signal?.aborted) {
    while (next < channel.events.length) {
      const event = channel.events[next];
      next += 1;
      if (event) {
        yield event;
        if (isTerminalEvent(event)) {
          return;
        }
      }
    }
    if (channel.isDone) {
      return;
    }
    await waitForRunEvent(channel, signal);
  }
}

/**
 * No buffer in this process: the run finished earlier, or its process died.
 * Poll the row until it is terminal; a run past the lock window is failed by loadRunView.
 */
async function* followDatabase(
  runId: string,
  first: RunView,
  signal?: AbortSignal,
): AsyncGenerator<RunStreamEvent> {
  let view = first;
  while (!signal?.aborted) {
    const terminal = terminalEventFor(view);
    if (terminal) {
      yield terminal;
      return;
    }
    await sleep(ORPHAN_POLL_MS, signal);
    if (!signal?.aborted) {
      view = await loadRunView(runId);
    }
  }
}

/**
 * Yields the run snapshot first, then every event until run.done or run.error.
 * The first `next()` throws NotFoundError for an unknown run, before any SSE header is sent.
 */
export async function* openRunStream(
  runId: string,
  signal?: AbortSignal,
): AsyncGenerator<RunStreamEvent> {
  const view = await loadRunView(runId);
  yield { type: "run.snapshot", runId, snapshot: view.snapshot };

  const channel = getRunChannel(runId);
  if (channel) {
    yield* followChannel(channel, signal);
    return;
  }
  yield* followDatabase(runId, view, signal);
}
