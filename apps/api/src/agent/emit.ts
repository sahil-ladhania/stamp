/**
 * File: emit.ts
 * Purpose: The one helper nodes use to send a typed progress event; it adds the run id and stops after an abort.
 * Exports: emit, EventBody
 * Used by: agent/stage-node.ts, agent/nodes/*
 */
import type { RunnableConfig } from "@langchain/core/runnables";
import { getDeps } from "./deps.js";
import type { AgentEvent } from "./run-agent.js";

/** An event without its run id, which `emit` fills in. */
export type EventBody = AgentEvent extends infer Event
  ? Event extends { runId: string }
    ? Omit<Event, "runId">
    : never
  : never;

/** Sends one event. Throws the abort reason if the run was aborted, so a cancelled run emits nothing more. */
export async function emit(
  config: RunnableConfig,
  body: EventBody,
): Promise<void> {
  config.signal?.throwIfAborted();
  const deps = getDeps(config);
  await deps.emit({ ...body, runId: deps.runId } as AgentEvent);
}
