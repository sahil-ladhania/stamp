/**
 * File: run-real-agent-full.test.ts
 * Purpose: Runs the whole graph with the real stages and inline mocks of Tavily, the model, the network and the database: a valid guide comes out.
 * Exports: (none)
 * Used by: vitest
 */
import { GuideSchema, type Claim } from "@stamp/schema";
import { lookup } from "node:dns/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger.js";
import { structured } from "../lib/openai.js";
import { extractPages, searchWeb } from "../lib/tavily.js";
import { fakeDb } from "../test-support/fake-db.js";
import { replyBySection } from "../test-support/extract-replies.js";
import {
  AUTH_URL,
  MODEL_REPLIES,
  fullRunInput,
  resetFullRun,
} from "../test-support/full-run.js";
import { trace } from "../test-support/graph-harness.js";

vi.mock("../config.js", () => ({
  getConfig: () => ({
    AGENT_RUN_BUDGET_MS: 120_000,
    AGENT_EXTRACT_CONCURRENCY: 5,
    AGENT_PROBE: "on",
  }),
}));
vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));
vi.mock("../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
vi.mock("../lib/openai.js", () => ({ structured: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);
const { runRealAgent } = await import("./run-real-agent.js");

const model = vi.mocked(structured);
const search = vi.mocked(searchWeb);
const extract = vi.mocked(extractPages);
const dns = vi.mocked(lookup);
(["info", "warn", "error"] as const).forEach((level) =>
  vi.spyOn(logger, level).mockImplementation(() => {}),
);

beforeEach(() => {
  fakeDb.reset();
  resetFullRun({ search, extract, fetch: fetchMock, dns });
  model.mockReset().mockImplementation(replyBySection(MODEL_REPLIES) as never);
});

const storedGuide = () => GuideSchema.parse(fakeDb.guides.get("acme")?.data);
const byId = (claims: Claim[]) =>
  Object.fromEntries(claims.map((c) => [c.id, c.label]));

describe("a full run with the real stages", () => {
  it("finishes done and stores a guide that passes the schema", async () => {
    const { input } = fullRunInput();
    expect(await runRealAgent(input)).toEqual({
      ok: true,
      slug: "acme",
      status: "done",
    });
    expect(storedGuide()).toMatchObject({
      slug: "acme",
      appName: "Acme",
      domain: "acme.com",
      mode: "live",
      coverage: "full",
    });
  });

  it("emits all nine stages in order, each started and done", async () => {
    const { input, events } = fullRunInput();
    await runRealAgent(input);
    const stages = trace(events).filter((e) => e.startsWith("stage."));
    expect(stages).toEqual(
      Array.from({ length: 9 }, (_, i) => [
        `stage.started:${i}`,
        `stage.done:${i}`,
      ]).flat(),
    );
  });

  it("labels the claims from the checks: quoted facts Sourced, the probed step Tested, estimates Uncertain", async () => {
    await runRealAgent(fullRunInput().input);
    const guide = storedGuide();
    expect(guide.steps[0]?.detail.label).toBe("tested");
    expect(guide.steps[1]?.detail.label).toBe("sourced");
    expect(guide.scopes[0]?.reason.label).toBe("sourced");
    expect(guide.milestones.production.wait.label).toBe("uncertain");
    expect(guide.steps[0]?.effort).toMatchObject({
      label: "uncertain",
      sources: [],
    });
    expect(guide.verdict).toMatchObject({
      nextStepId: "steps.0",
      topBlockerId: "blockers.0",
    });
  });

  it("sends the one probe GET to the authorize URL on the official domain, once", async () => {
    await runRealAgent(fullRunInput().input);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url).startsWith(AUTH_URL)).toBe(true);
    expect(init).toMatchObject({ method: "GET", redirect: "manual" });
  });

  it("scores the verified gates: required review, a 5 to 7 day wait, a prerequisite and a hidden limit", async () => {
    await runRealAgent(fullRunInput().input);
    const guide = storedGuide();
    expect(guide.difficultyBreakdown).toEqual({
      reviewGate: 2,
      approvalWait: 1,
      prerequisites: 1,
      hiddenLimits: 1,
      total: 5,
      score: 3,
    });
    expect(guide).toMatchObject({ difficulty: 3, archetype: "hidden_limits" });
  });

  it("emits a claim.verified for the Sourced claims, and none after the probe", async () => {
    const { input, events } = fullRunInput();
    await runRealAgent(input);
    const types = trace(events);
    expect(types).toContain("claim.verified");
    expect(types.indexOf("stage.started:6")).toBeGreaterThan(
      types.lastIndexOf("claim.verified"),
    );
    expect(
      types
        .slice(types.indexOf("stage.started:6"))
        .some((t) => t.startsWith("claim.")),
    ).toBe(false);
  });

  it("writes the quote checks and the probe checks to the verification log", async () => {
    await runRealAgent(fullRunInput().input);
    const rows = fakeDb.verificationLog.rows;
    expect(
      rows.filter((r) => r.method === "QUOTE_MATCH").length,
    ).toBeGreaterThan(5);
    expect(
      rows
        .filter((r) => r.method === "PROBE")
        .map((r) => [r.claimId, r.result]),
    ).toEqual([["steps.0.detail", "PASS"]]);
    expect(
      rows.every((r) => r.runId === "run_full" && r.guideId === "guide_acme"),
    ).toBe(true);
  });

  it("does not probe when the kill switch is off, and everything else is unchanged", async () => {
    await runRealAgent(fullRunInput().input, { probeEnabled: false });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(byId(storedGuide().steps.map((s) => s.detail))).toEqual({
      "steps.0.detail": "sourced",
      "steps.1.detail": "sourced",
    });
  });
});
