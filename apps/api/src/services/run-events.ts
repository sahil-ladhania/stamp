/**
 * File: run-events.ts
 * Purpose: In-memory event buffer per run; streams replay it, then follow live events.
 * Exports: openRunChannel, getRunChannel, publishRunEvent, waitForRunEvent, isTerminalEvent, RunChannel
 * Used by: services/run-executor.ts, services/run-stream.ts
 */
import type { RunStreamEvent } from "@stamp/schema";
import { logger } from "../lib/logger.js";

export type RunChannel = {
  /** Append-only, so a reader keeps its place with a plain index. */
  events: RunStreamEvent[];
  waiters: Set<() => void>;
  isDone: boolean;
};

const MAX_EVENTS_PER_RUN = 2000;
const RETENTION_MS = 10 * 60_000;

const channels = new Map<string, RunChannel>();

/** True for the two events that end a run's stream. */
export function isTerminalEvent(event: RunStreamEvent): boolean {
  return event.type === "run.done" || event.type === "run.error";
}

/** Creates the buffer for a run that is about to start. */
export function openRunChannel(runId: string): RunChannel {
  const channel: RunChannel = { events: [], waiters: new Set(), isDone: false };
  channels.set(runId, channel);
  return channel;
}

/** Returns the buffer while the run is live or recently finished; undefined after a restart or expiry. */
export function getRunChannel(runId: string): RunChannel | undefined {
  return channels.get(runId);
}

/** Appends an event and wakes every waiting stream; the terminal event closes the channel. */
export function publishRunEvent(runId: string, event: RunStreamEvent): void {
  const channel = channels.get(runId);
  if (!channel || channel.isDone) {
    throw new Error(`No open event channel for run ${runId}`);
  }
  const isTerminal = isTerminalEvent(event);
  if (channel.events.length >= MAX_EVENTS_PER_RUN && !isTerminal) {
    logger.warn("run event buffer full; dropping event", { runId });
    return;
  }
  channel.events.push(event);
  if (isTerminal) {
    channel.isDone = true;
    setTimeout(() => channels.delete(runId), RETENTION_MS).unref();
  }
  for (const wake of [...channel.waiters]) {
    wake();
  }
}

/** Resolves on the next publish to this channel, or when the signal aborts. */
export function waitForRunEvent(
  channel: RunChannel,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const wake = (): void => {
      channel.waiters.delete(wake);
      signal?.removeEventListener("abort", wake);
      resolve();
    };
    channel.waiters.add(wake);
    signal?.addEventListener("abort", wake, { once: true });
  });
}
