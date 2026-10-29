/**
 * File: run-one.test.ts
 * Purpose: Tests running one app in-process with a fake runner: what the capture holds after a finished run and how the gate facts are read.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { AgentOutcome, RunAgentInput } from "../../src/agent/run-agent.js";
import type { RealAgentOptions } from "../../src/agent/run-real-agent.js";
import { GATES_OUTPUT } from "../../src/test-support/extract-replies.js";
import { createHarness } from "../../src/test-support/graph-harness.js";
import { readyState } from "../../src/test-support/save-helpers.js";
import {
  gmailGolden as golden,
  MODELS,
  setup,
  SUMMARY,
} from "./fixtures/run-one-helpers.js";
import { runOne } from "./run-one.js";

describe("runOne", () => {
  it("captures the guide, gates, pages, usage and trace of a finished run", async () => {
    const { tap, log } = setup();
    let received: RealAgentOptions | undefined;
    const runner = async (
      input: RunAgentInput,
      options: RealAgentOptions,
    ): Promise<AgentOutcome> => {
      received = options;
      await input.emit({
        runId: input.runId,
        type: "stage.started",
        stage: 0,
        name: "Resolve",
      });
      const h = createHarness();
      await options.nodes?.save?.(readyState({ retryCount: 1 }), h.config);
      log({ ...SUMMARY, runId: input.runId });
      return { ok: true, slug: input.slug, status: "done" };
    };
    const capture = await runOne(golden, { tap, runner, models: MODELS });
    tap.stop();

    expect(capture).toMatchObject({
      slug: "gmail",
      typed: "Gmail",
      outcome: { ok: true, status: "done" },
      durationMs: 41_000,
      stageReached: 8,
      retried: true,
      models: MODELS,
    });
    expect(capture.guide?.slug).toBe("acme");
    expect(capture.pages.length).toBeGreaterThan(0);
    expect(capture.usage).toMatchObject({
      tavilyCredits: 11,
      strongInputTokens: 30_000,
      totalTokens: 31_850,
    });
    expect(capture.events[0]?.event).toMatchObject({ type: "stage.started" });
    expect(capture.logs.map((l) => l.message)).toEqual(["run summary"]);
    expect(
      await received?.pageCache?.get("https://docs.acme.com/a"),
    ).toBeNull();
  });

  it("reads the gate facts from the verified gates and the tier of the page behind each", async () => {
    const { tap, log } = setup();
    const runner = async (
      input: RunAgentInput,
      options: RealAgentOptions,
    ): Promise<AgentOutcome> => {
      await options.nodes?.save?.(
        readyState({ gates: GATES_OUTPUT }),
        createHarness().config,
      );
      log({ ...SUMMARY, runId: input.runId });
      return { ok: true, slug: input.slug, status: "done" };
    };
    const capture = await runOne(golden, { tap, runner, models: MODELS });
    tap.stop();
    expect(capture.gates).toMatchObject({
      reviewGate: "required_to_scale",
      reviewGateTier: "official",
      reviewGateEvidence: { quote: expect.any(String) },
      approvalWait: { minDays: 5, maxDays: 7 },
      approvalWaitTier: "official",
      approvalWaitEvidence: { quote: expect.any(String) },
    });
  });

  it("counts the gates as unknown when verify did not run or there are none", async () => {
    const { tap, log } = setup();
    const runner = async (
      input: RunAgentInput,
      options: RealAgentOptions,
    ): Promise<AgentOutcome> => {
      await options.nodes?.save?.(
        readyState({ gates: null }),
        createHarness().config,
      );
      log({ ...SUMMARY, runId: input.runId });
      return { ok: true, slug: input.slug, status: "partial" };
    };
    const capture = await runOne(golden, { tap, runner, models: MODELS });
    tap.stop();
    expect(capture.gates).toEqual({
      reviewGate: "unknown",
      reviewGateTier: null,
      reviewGateEvidence: null,
      approvalWait: "unknown",
      approvalWaitTier: null,
      approvalWaitEvidence: null,
    });
    expect(capture.outcome).toEqual({ ok: true, status: "partial" });
  });
});
