/**
 * File: run-app.ts
 * Purpose: Shared setup for HTTP tests of /api/runs: app per test, run helpers, a scripted agent.
 * Exports: useRunsApp, postRun, startedRunId, scriptedAgent
 * Used by: app-runs.test.ts, app-runs-stream.test.ts
 */
import { StartRunResultSchema } from "@stamp/schema";
import { afterEach, beforeEach, vi } from "vitest";
import { runAgent } from "../agent/run-agent.js";
import type { AgentOutcome, RunAgentInput } from "../agent/run-agent.js";
import { createApp } from "../app.js";
import { fakeDb } from "./fake-db.js";
import { serve, type TestServer } from "./serve.js";
import { testConfig } from "./test-config.js";

/** Call at the top of a test file that mocks prisma, config and run-agent; serves a fresh app per test. */
export function useRunsApp(): {
  url: () => string;
  agent: ReturnType<typeof vi.mocked<typeof runAgent>>;
} {
  let server: TestServer;
  const agent = vi.mocked(runAgent);

  beforeEach(async () => {
    fakeDb.reset();
    agent.mockReset();
    vi.spyOn(process.stderr, "write").mockReturnValue(true);
    server = await serve(createApp(testConfig));
  });

  afterEach(async () => {
    await server.close();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  return { url: () => server.url, agent };
}

export function postRun(baseUrl: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Starts a run and returns its id; fails the test if the guide was cached instead. */
export async function startedRunId(
  baseUrl: string,
  app = "Notion",
): Promise<string> {
  const result = StartRunResultSchema.parse(
    await (await postRun(baseUrl, { app })).json(),
  );
  if (result.status === "cached") {
    throw new Error("expected a run, got a cached guide");
  }
  return result.runId;
}

/** Two stages and a query, then it stores the guide the way the save stage will. `gate` pauses it mid-run. */
export function scriptedAgent(gate?: Promise<void>) {
  return async ({ emit, runId }: RunAgentInput): Promise<AgentOutcome> => {
    await emit({ type: "stage.started", runId, stage: 0, name: "resolve_app" });
    await emit({ type: "search.query", runId, query: "notion oauth scopes" });
    await gate;
    await emit({ type: "stage.started", runId, stage: 8, name: "save" });
    fakeDb.addGuide({ slug: "notion", mode: "LIVE" });
    return { ok: true, slug: "notion", status: "done" };
  };
}
