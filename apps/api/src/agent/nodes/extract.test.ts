/**
 * File: extract.test.ts
 * Purpose: Tests the extract stage's first pass with a mocked model: the nine calls, their order, concurrency, drafts and logging.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import {
  GATES_OUTPUT,
  replyBySection,
} from "../../test-support/extract-replies.js";
import {
  createHarness,
  makeState,
  trace,
} from "../../test-support/graph-harness.js";
import { APP } from "../../test-support/node-fixtures.js";
import { PAGES } from "../../test-support/extract-fixtures.js";
import { FIRST_WAVE } from "../extract/sections.js";
import { extractNode } from "./extract.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
const info = vi.spyOn(logger, "info");
const state = (extra: Partial<Parameters<typeof makeState>[0]> = {}) =>
  makeState({ app: APP, pages: PAGES, ...extra });
const names = () => model.mock.calls.map(([, options]) => options.name);

beforeEach(() => {
  model.mockReset().mockImplementation(replyBySection() as never);
  info.mockReset().mockImplementation(() => {});
});

describe("extractNode first pass", () => {
  it("makes one strong-model call for each of the eight sections, then one for the verdict", async () => {
    const h = createHarness();
    await extractNode(state(), h.config);
    expect(model).toHaveBeenCalledTimes(9);
    expect(model.mock.calls.every(([tier]) => tier === "strong")).toBe(true);
    expect([...names().slice(0, 8)].sort()).toEqual(
      FIRST_WAVE.map((s) => `extract_${s}`).sort(),
    );
    expect(names()[8]).toBe("extract_verdict");
  });

  it("starts the sections in priority order", async () => {
    const h = createHarness();
    await extractNode(state(), h.config);
    expect(names().slice(0, 5)).toEqual([
      "extract_steps",
      "extract_scopes",
      "extract_requirements",
      "extract_blockers",
      "extract_milestones",
    ]);
  });

  it("runs the verdict only after the others, with the numbered steps and blockers it picks from", async () => {
    const h = createHarness();
    let verdictSawSteps = false;
    model.mockImplementation(((
      tier: string,
      options: { name: string; messages: { content: string }[] },
    ) => {
      if (options.name === "extract_verdict") {
        verdictSawSteps = options.messages[1]!.content.includes(
          "Steps:\n0. Create the app",
        );
      }
      return replyBySection()(tier, options);
    }) as never);
    await extractNode(state(), h.config);
    expect(verdictSawSteps).toBe(true);
  });

  it("returns a draft for each section but the gates, and the gates facts separately", async () => {
    const h = createHarness();
    const update = await extractNode(state(), h.config);
    expect(Object.keys(update.drafts ?? {}).sort()).toEqual([
      "blockers",
      "conflicts",
      "limits",
      "milestones",
      "requirements",
      "scopes",
      "steps",
      "verdict",
    ]);
    expect(update.gates).toEqual(GATES_OUTPUT);
    expect(update.failure).toBeUndefined();
    expect(update.partial).toBeUndefined();
  });

  it("emits only its stage events", async () => {
    const h = createHarness();
    await extractNode(state(), h.config);
    expect(trace(h.events)).toEqual(["stage.started:4", "stage.done:4"]);
  });

  it("gives every call a per-call limit of 25 s inside the stage's 40 s window", async () => {
    const h = createHarness();
    await extractNode(state(), h.config);
    expect(model.mock.calls[0]?.[1].timeoutMs).toBe(25_000);
  });
});

describe("extractNode concurrency", () => {
  const peakWith = async (concurrency: number) => {
    const h = createHarness();
    h.deps.extractConcurrency = concurrency;
    let running = 0;
    let peak = 0;
    model.mockImplementation((async (
      tier: string,
      options: { name: string },
    ) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return replyBySection()(tier, options);
    }) as never);
    await extractNode(state(), h.config);
    return peak;
  };

  it("runs 5 calls at once by default", async () => {
    expect(await peakWith(5)).toBe(5);
  });

  it("honours a lower setting", async () => {
    expect(await peakWith(2)).toBe(2);
  });
});

describe("extractNode logging", () => {
  it("logs one summary with a row per section: duration, tokens and calls, and no text", async () => {
    const h = createHarness();
    await extractNode(state(), h.config);
    const summary = info.mock.calls.find(
      ([message]) => message === "extract summary",
    );
    expect(summary?.[1]).toMatchObject({
      runId: "run_1",
      retryPass: false,
      concurrency: 5,
      windowMs: 34_000,
    });
    const rows = (
      summary?.[1] as {
        sections: { section: string; calls: number; inputTokens: number }[];
      }
    ).sections;
    expect(rows).toHaveLength(9);
    expect(
      rows.every((row) => row.calls === 1 && row.inputTokens === 1_000),
    ).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("client secret");
  });

  it("fails with INTERNAL, calling no model, if there is no app or no page", async () => {
    const h = createHarness();
    expect(
      (await extractNode(makeState({ pages: PAGES }), h.config)).failure,
    ).toMatchObject({ stage: 4, code: "INTERNAL" });
    expect(
      (await extractNode(makeState({ app: APP }), h.config)).failure,
    ).toMatchObject({ code: "INTERNAL" });
    expect(model).not.toHaveBeenCalled();
  });
});
