/**
 * File: app-runs-stub.test.ts
 * Purpose: HTTP tests of every stub scenario through the real executor, stream and guide endpoints.
 * Exports: (none)
 * Used by: vitest
 */
import { ApiErrorBodySchema, GuideSchema } from "@stamp/schema";
import { describe, expect, it, vi } from "vitest";
import { runRealAgent } from "./agent/run-real-agent.js";
import { fakeDb } from "./test-support/fake-db.js";
import { parseSse, type SseMessage } from "./test-support/parse-sse.js";
import { postRun, startedRunId, useRunsApp } from "./test-support/run-app.js";

const config = vi.hoisted(() => ({ AGENT_MODE: "stub", DAILY_RUN_CAP: 50 }));
vi.mock("./config.js", () => ({ getConfig: () => config }));
vi.mock("./lib/prisma.js", async () => ({
  prisma: (await import("./test-support/fake-db.js")).fakeDb.prisma,
}));
vi.mock("./utils/sleep.js", () => ({ sleep: () => Promise.resolve() }));
// Real mode runs the LangGraph agent, which needs live keys; a stand-in checks the wiring.
vi.mock("./agent/run-real-agent.js", () => ({ runRealAgent: vi.fn() }));

const app = useRunsApp();

/** Starts a run for what the tester typed and returns its id, SSE messages and final snapshot. */
async function runStub(typed: string) {
  config.AGENT_MODE = "stub";
  const id = await startedRunId(app.url(), typed);
  const body = await (await fetch(`${app.url()}/api/runs/${id}/stream`)).text();
  const messages = parseSse(body).messages;
  const snapshot = await (await fetch(`${app.url()}/api/runs/${id}`)).json();
  return { id, messages, snapshot, raw: body };
}

const events = (messages: SseMessage[]) => messages.map((m) => m.event);
const last = (messages: SseMessage[]) =>
  messages.at(-1)?.data as Record<string, unknown>;
const guideUrl = (slug: string) => `${app.url()}/api/guides/${slug}`;

describe("default stub run", () => {
  it("streams all 9 stages, queries, pages and claims, then run.done", async () => {
    const { messages, snapshot } = await runStub("Notion");
    const count = (name: string) =>
      events(messages).filter((e) => e === name).length;
    expect(events(messages)[0]).toBe("run.snapshot");
    expect(count("stage.started")).toBe(9);
    expect(count("stage.done")).toBe(9);
    expect(count("search.query")).toBe(4);
    expect(count("page.fetched")).toBe(5);
    expect(count("claim.verified")).toBeGreaterThanOrEqual(3);
    expect(count("claim.downgraded")).toBe(1);
    expect(last(messages)).toMatchObject({
      type: "run.done",
      slug: "notion",
      status: "done",
    });
    expect(snapshot).toMatchObject({
      status: "done",
      stageReached: 8,
      slug: "notion",
    });
  });

  it("saves a marked live guide that the guide endpoint serves", async () => {
    await runStub("Notion");
    const response = await fetch(guideUrl("notion"));
    expect(response.status).toBe(200);
    const guide = GuideSchema.parse(await response.json());
    expect(guide).toMatchObject({
      slug: "notion",
      mode: "live",
      appName: "Notion (stub data)",
      domain: "example.com",
    });
    expect(guide.verdict.summary.text).toBe(
      "Stub guide: scripted test data, not real research",
    );
  });

  it("never lets a stub guide count as a cached guide, so the next lookup runs again", async () => {
    await runStub("Notion");
    expect(fakeDb.guides.get("notion")?.mode).toBe("LIVE");
    const again = await postRun(app.url(), { app: "Notion" });
    expect(again.status).toBe(202);
    expect(await again.json()).toMatchObject({ status: "started" });
  });

  it("uses a stub guide whose name is a URL the same way", async () => {
    const { messages } = await runStub("https://www.notion.so");
    expect(last(messages)).toMatchObject({ type: "run.done", slug: "notion" });
  });
});

describe("stub-partial", () => {
  it("ends with run.done partial and a partial guide", async () => {
    const { messages, snapshot } = await runStub("stub-partial");
    expect(last(messages)).toMatchObject({
      type: "run.done",
      slug: "stub-partial",
      status: "partial",
    });
    expect(snapshot).toMatchObject({ status: "partial", stageReached: 8 });
    const guide = GuideSchema.parse(
      await (await fetch(guideUrl("stub-partial"))).json(),
    );
    expect(guide.coverage).toBe("partial");
    const reasons = messages.flatMap((m) => {
      const data = m.data as { type: string; reason?: string };
      return data.type === "claim.downgraded" ? [data.reason] : [];
    });
    expect(new Set(reasons)).toEqual(new Set(["time_budget"]));
  });
});

describe("failure scenarios", () => {
  it("stub-error: run.error INTERNAL at stage 4, no guide saved", async () => {
    const { messages, snapshot } = await runStub("stub-error");
    expect(last(messages)).toMatchObject({
      type: "run.error",
      code: "INTERNAL",
      stage: 4,
    });
    expect(events(messages).filter((e) => e === "stage.done")).toHaveLength(4);
    expect(snapshot).toMatchObject({
      status: "failed",
      errorCode: "INTERNAL",
      stageReached: 4,
    });
    const missing = await fetch(guideUrl("stub-error"));
    expect(missing.status).toBe(404);
    expect(ApiErrorBodySchema.parse(await missing.json()).error.code).toBe(
      "NOT_FOUND",
    );
  });

  it("stub-ambiguous: run.error AMBIGUOUS_APP with 2 options", async () => {
    const { messages, snapshot } = await runStub("stub-ambiguous");
    const error = last(messages);
    expect(error).toMatchObject({
      type: "run.error",
      code: "AMBIGUOUS_APP",
      stage: 0,
    });
    expect(error.options).toEqual([
      { name: "Stub Alpha", domain: "alpha.example.com" },
      { name: "Stub Beta", domain: "beta.example.com" },
    ]);
    expect(snapshot).toMatchObject({
      status: "failed",
      errorCode: "AMBIGUOUS_APP",
    });
  });

  it("stub-notoauth: run.error NOT_OAUTH at stage 3", async () => {
    const { messages, snapshot } = await runStub("stub-notoauth");
    expect(last(messages)).toMatchObject({
      type: "run.error",
      code: "NOT_OAUTH",
      stage: 3,
    });
    expect(last(messages)).not.toHaveProperty("options");
    expect(snapshot).toMatchObject({
      status: "failed",
      errorCode: "NOT_OAUTH",
      stageReached: 3,
    });
  });

  it("finds a scenario however the name is typed, and frees the lock afterwards", async () => {
    const { messages } = await runStub("Stub Error");
    expect(last(messages)).toMatchObject({ code: "INTERNAL", stage: 4 });
    expect(
      [...fakeDb.runs.values()].every((run) => run.activeSlug === null),
    ).toBe(true);
  });
});

describe("real mode", () => {
  it("hands the run to the real agent, streams its result and ignores scenario names", async () => {
    config.AGENT_MODE = "real";
    vi.mocked(runRealAgent).mockResolvedValue({
      ok: false,
      failure: { stage: 0, code: "NO_PUBLIC_DOCS", message: "No docs found." },
    });
    const id = await startedRunId(app.url(), "stub-ambiguous");
    const body = await (
      await fetch(`${app.url()}/api/runs/${id}/stream`)
    ).text();
    expect(last(parseSse(body).messages)).toMatchObject({
      type: "run.error",
      code: "NO_PUBLIC_DOCS",
      stage: 0,
    });
    expect(runRealAgent).toHaveBeenCalledWith(
      expect.objectContaining({ runId: id, app: "stub-ambiguous" }),
    );
    config.AGENT_MODE = "stub";
  });
});
