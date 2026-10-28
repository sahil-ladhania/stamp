/**
 * File: stub-play.ts
 * Purpose: Test helper that runs the stub agent for an app slug and collects what it emitted.
 * Exports: play, stageEvents, typesOf
 * Used by: agent/stub/run-stub-agent*.test.ts
 */
import type { AgentEvent, RunAgentInput } from "../agent/run-agent.js";
import { runStubAgent } from "../agent/stub/run-stub-agent.js";

/** Runs the stub for an app slug and returns everything it emitted. */
export async function play(
  slug: string,
  signal: AbortSignal = new AbortController().signal,
) {
  const events: AgentEvent[] = [];
  const input: RunAgentInput = {
    runId: "run_1",
    app: slug,
    slug,
    emit: async (event) => {
      events.push(event);
    },
    signal,
  };
  const outcome = await runStubAgent(input);
  return { events, outcome };
}

export const stageEvents = (events: AgentEvent[]) =>
  events.flatMap((e) =>
    e.type === "stage.started" || e.type === "stage.done" ? [e] : [],
  );
export const typesOf = (events: AgentEvent[]) => events.map((e) => e.type);
