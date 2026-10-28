/**
 * File: app-runs.test.ts
 * Purpose: HTTP-level tests for POST /api/runs and GET /api/runs/:id.
 * Exports: (none)
 * Used by: vitest
 */
import { ApiErrorBodySchema, StartRunResultSchema } from "@stamp/schema";
import { describe, expect, it, vi } from "vitest";
import { fakeDb } from "./test-support/fake-db.js";
import {
  postRun,
  scriptedAgent,
  startedRunId,
  useRunsApp,
} from "./test-support/run-app.js";

vi.mock("./lib/prisma.js", async () => ({
  prisma: (await import("./test-support/fake-db.js")).fakeDb.prisma,
}));
vi.mock("./config.js", () => ({ getConfig: () => ({ DAILY_RUN_CAP: 2 }) }));
vi.mock("./agent/run-agent.js", () => ({ runAgent: vi.fn() }));

const { getRunChannel } = await import("./services/run-events.js");
const app = useRunsApp();

describe("POST /api/runs", () => {
  it("returns 400 for a missing, too short or unknown-field body", async () => {
    for (const body of [
      {},
      { app: "a" },
      { app: "Notion", extra: 1 },
      { app: 5 },
    ]) {
      const response = await postRun(app.url(), body);
      expect(response.status).toBe(400);
      expect(ApiErrorBodySchema.parse(await response.json()).error.code).toBe(
        "VALIDATION_ERROR",
      );
    }
  });

  it("returns 200 cached for a library guide", async () => {
    fakeDb.addGuide({ slug: "hubspot", mode: "LIBRARY" });
    const response = await postRun(app.url(), { app: "HubSpot" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "cached",
      slug: "hubspot",
    });
  });

  it("returns 202 started, then 202 running with the same id for a second request", async () => {
    app.agent.mockImplementation(scriptedAgent(new Promise(() => {})));
    const first = await postRun(app.url(), { app: "Notion" });
    expect(first.status).toBe(202);
    const started = StartRunResultSchema.parse(await first.json());
    expect(started.status).toBe("started");
    const second = await postRun(app.url(), { app: "notion" });
    expect(second.status).toBe(202);
    expect(await second.json()).toEqual({
      status: "running",
      runId: "runId" in started ? started.runId : "",
    });
  });

  it("returns 503 RUN_CAP_REACHED once the daily cap is used", async () => {
    app.agent.mockResolvedValue({
      ok: false,
      failure: { stage: 0, code: "INTERNAL", message: "x" },
    });
    await startedRunId(app.url(), "Notion");
    await startedRunId(app.url(), "Slack");
    const response = await postRun(app.url(), { app: "Asana" });
    expect(response.status).toBe(503);
    expect(ApiErrorBodySchema.parse(await response.json()).error.code).toBe(
      "RUN_CAP_REACHED",
    );
  });
});

describe("GET /api/runs/:id", () => {
  it("returns the snapshot, which turns done after the run", async () => {
    app.agent.mockImplementation(scriptedAgent());
    const id = await startedRunId(app.url());
    await vi.waitFor(() => expect(getRunChannel(id)?.isDone).toBe(true));
    const response = await fetch(`${app.url()}/api/runs/${id}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      runId: id,
      slug: "notion",
      status: "done",
      stageReached: 8,
    });
  });

  it("returns 404 NOT_FOUND for an unknown run", async () => {
    const response = await fetch(`${app.url()}/api/runs/run_nope`);
    expect(response.status).toBe(404);
    expect(ApiErrorBodySchema.parse(await response.json()).error.code).toBe(
      "NOT_FOUND",
    );
  });
});
