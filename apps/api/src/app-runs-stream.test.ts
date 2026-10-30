/**
 * File: app-runs-stream.test.ts
 * Purpose: HTTP-level tests for GET /api/runs/:id/stream: replay, join, errors, disconnect, heartbeat.
 * Exports: (none)
 * Used by: vitest
 */
import { RunStreamEventSchema } from "@stamp/schema";
import { describe, expect, it, vi } from "vitest";
import { parseSse } from "./test-support/parse-sse.js";
import {
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

describe("GET /api/runs/:id/stream", () => {
  it("streams the snapshot and every event, then closes after run.done", async () => {
    app.agent.mockImplementation(scriptedAgent());
    const id = await startedRunId(app.url());
    const response = await fetch(`${app.url()}/api/runs/${id}/stream`);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const { messages } = parseSse(await response.text());
    expect(messages.map((m) => m.event)).toEqual([
      "run.snapshot",
      "stage.started",
      "search.query",
      "stage.started",
      "run.done",
    ]);
    messages.forEach((m) =>
      expect(RunStreamEventSchema.safeParse(m.data).success).toBe(true),
    );
    expect(messages.at(-1)?.data).toMatchObject({
      type: "run.done",
      slug: "notion",
      status: "done",
    });
  });

  it("sends the stream unbuffered and uncompressed, even to a client that accepts gzip and brotli", async () => {
    app.agent.mockImplementation(scriptedAgent());
    const id = await startedRunId(app.url());
    const response = await fetch(`${app.url()}/api/runs/${id}/stream`, {
      headers: { "Accept-Encoding": "gzip, deflate, br" },
    });
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("cache-control")).toBe(
      "no-cache, no-transform",
    );
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    expect(response.headers.get("content-length")).toBeNull();
    await response.text();
  });

  it("lets a client join mid-run: replay first, then the live remainder", async () => {
    let release: () => void = () => {};
    app.agent.mockImplementation(
      scriptedAgent(
        new Promise<void>((resolve) => {
          release = resolve;
        }),
      ),
    );
    const id = await startedRunId(app.url());
    await vi.waitFor(() => expect(getRunChannel(id)?.events.length).toBe(2));
    const pending = fetch(`${app.url()}/api/runs/${id}/stream`).then((r) =>
      r.text(),
    );
    await vi.waitFor(() => expect(getRunChannel(id)?.waiters.size).toBe(1));
    release();
    const { messages } = parseSse(await pending);
    expect(messages.map((m) => m.event)).toEqual([
      "run.snapshot",
      "stage.started",
      "search.query",
      "stage.started",
      "run.done",
    ]);
  });

  it("replays the whole run to a client that reconnects after it finished", async () => {
    app.agent.mockImplementation(scriptedAgent());
    const id = await startedRunId(app.url());
    await vi.waitFor(() => expect(getRunChannel(id)?.isDone).toBe(true));
    const { messages } = parseSse(
      await (await fetch(`${app.url()}/api/runs/${id}/stream`)).text(),
    );
    expect(messages.map((m) => m.event)).toEqual([
      "run.snapshot",
      "stage.started",
      "search.query",
      "stage.started",
      "run.done",
    ]);
  });

  it("ends an agent failure with run.error", async () => {
    app.agent.mockResolvedValue({
      ok: false,
      failure: { stage: 0, code: "NOT_OAUTH", message: "API keys only." },
    });
    const id = await startedRunId(app.url(), "Acme");
    const { messages } = parseSse(
      await (await fetch(`${app.url()}/api/runs/${id}/stream`)).text(),
    );
    expect(messages.map((m) => m.event)).toEqual(["run.snapshot", "run.error"]);
    expect(messages[1]?.data).toMatchObject({
      code: "NOT_OAUTH",
      message: "API keys only.",
    });
  });

  it("returns a JSON 404, not an event stream, for an unknown run", async () => {
    const response = await fetch(`${app.url()}/api/runs/run_nope/stream`);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("stops following the run when the client disconnects", async () => {
    app.agent.mockImplementation(scriptedAgent(new Promise(() => {})));
    const id = await startedRunId(app.url());
    const controller = new AbortController();
    const response = await fetch(`${app.url()}/api/runs/${id}/stream`, {
      signal: controller.signal,
    });
    const reader = response.body?.getReader();
    await reader?.read();
    await vi.waitFor(() => expect(getRunChannel(id)?.waiters.size).toBe(1));
    controller.abort();
    await vi.waitFor(() => expect(getRunChannel(id)?.waiters.size).toBe(0));
  });

  it("sends a heartbeat comment every 15 seconds while the run is quiet", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    app.agent.mockImplementation(scriptedAgent(new Promise(() => {})));
    const id = await startedRunId(app.url());
    const controller = new AbortController();
    const response = await fetch(`${app.url()}/api/runs/${id}/stream`, {
      signal: controller.signal,
    });
    const reader = response.body?.getReader();
    await reader?.read();
    await vi.waitFor(() => expect(getRunChannel(id)?.waiters.size).toBe(1));
    await vi.advanceTimersByTimeAsync(15_000);
    const chunks: string[] = [];
    while (!chunks.join("").includes(": heartbeat")) {
      const next = await reader?.read();
      chunks.push(new TextDecoder().decode(next?.value));
    }
    expect(chunks.join("")).toContain(": heartbeat\n\n");
    controller.abort();
  });
});
