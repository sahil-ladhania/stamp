/**
 * File: run-real-agent-full-retry.test.ts
 * Purpose: Runs the whole graph with the real stages when the first steps reply quotes nothing real: one retry pass, then a valid guide.
 * Exports: (none)
 * Used by: vitest
 */
import { GuideSchema } from "@stamp/schema";
import { lookup } from "node:dns/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger.js";
import { structured } from "../lib/openai.js";
import { extractPages, searchWeb } from "../lib/tavily.js";
import { fakeDb } from "../test-support/fake-db.js";
import { OAUTH_URL, claim } from "../test-support/extract-fixtures.js";
import { replyBySection } from "../test-support/extract-replies.js";
import {
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

const fakeSteps = {
  steps: [
    {
      title: "Create the app",
      detail: claim(OAUTH_URL, "An invented step that is not on the page."),
      actor: "human" as const,
      effort: null,
    },
  ],
};
/** The steps call: a reply with an invented quote on its first call, the real one after. */
function stepsFailFirst(times: number) {
  let calls = 0;
  const real = replyBySection(MODEL_REPLIES);
  return (tier: string, options: { name: string }) => {
    if (options.name === "extract_steps" && calls++ < times) {
      return replyBySection({ ...MODEL_REPLIES, steps: fakeSteps })(
        tier,
        options,
      );
    }
    return real(tier, options);
  };
}
const stepsCalls = () =>
  model.mock.calls.filter(([, o]) => o.name === "extract_steps").length;
const stored = () => GuideSchema.parse(fakeDb.guides.get("acme")?.data);

beforeEach(() => {
  fakeDb.reset();
  resetFullRun({ search, extract, fetch: fetchMock, dns });
});

describe("a full run that needs the retry pass", () => {
  it("retries once, re-extracts only the steps, and ends with a valid, done guide", async () => {
    model.mockReset().mockImplementation(stepsFailFirst(1) as never);
    const { input, events } = fullRunInput();
    expect(await runRealAgent(input)).toEqual({
      ok: true,
      slug: "acme",
      status: "done",
    });
    expect(stepsCalls()).toBe(2);
    expect(trace(events).filter((e) => e === "stage.started:2")).toHaveLength(
      2,
    );
    expect(trace(events).filter((e) => e === "stage.started:6")).toHaveLength(
      1,
    );
    expect(stored().steps[0]?.detail.label).toBe("tested");
  });

  it("searches with the retry wording on the second pass", async () => {
    model.mockReset().mockImplementation(stepsFailFirst(1) as never);
    await runRealAgent(fullRunInput().input);
    const queries = search.mock.calls.map(([query]) => query);
    expect(queries).toHaveLength(8 + 1);
    expect(queries.at(-1)).toBe(
      "Acme how to create an OAuth app step by step guide",
    );
  });

  it("retries only once when the steps stay unverified, and still saves a valid guide", async () => {
    model.mockReset().mockImplementation(stepsFailFirst(2) as never);
    const { input } = fullRunInput();
    expect(await runRealAgent(input)).toEqual({
      ok: true,
      slug: "acme",
      status: "done",
    });
    expect(stepsCalls()).toBe(2);
    expect(stored().steps[0]?.detail).toMatchObject({
      label: "uncertain",
      sources: [],
    });
  });
});
