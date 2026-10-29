/**
 * File: run-one-failures.test.ts
 * Purpose: Tests runOne for a run that failed before saving, a run that overruns and is aborted, and the name and slug it runs with.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import type { AgentOutcome, RunAgentInput } from "../../src/agent/run-agent.js";
import {
  gmailGolden as golden,
  MODELS,
  setup,
} from "./fixtures/run-one-helpers.js";
import { runOne } from "./run-one.js";

describe("runOne when the run does not finish normally", () => {
  it("captures a run that failed before saving, with pages taken from its events", async () => {
    const { tap, log } = setup();
    const runner = async (input: RunAgentInput): Promise<AgentOutcome> => {
      await input.emit({
        runId: input.runId,
        type: "page.fetched",
        url: "https://developers.google.com/workspace/gmail/api/guides",
        tier: "official",
      });
      log({
        message: "run summary",
        runId: input.runId,
        durationMs: 9_000,
        stageReached: 3,
        tavilyCredits: 4,
      });
      return {
        ok: false,
        failure: { stage: 3, code: "NO_PUBLIC_DOCS", message: "x" },
      };
    };
    const capture = await runOne(golden, { tap, runner, models: MODELS });
    tap.stop();
    expect(capture.outcome).toEqual({ ok: false, code: "NO_PUBLIC_DOCS" });
    expect(capture.guide).toBeNull();
    expect(capture.gates).toBeNull();
    expect(capture.pages).toEqual([
      {
        url: "https://developers.google.com/workspace/gmail/api/guides",
        tier: "official",
      },
    ]);
    expect(capture.usage.tavilyCredits).toBe(4);
    expect(capture.stageReached).toBe(3);
  });

  it("aborts a run that overruns, and still reports it", async () => {
    const { tap } = setup();
    const runner = async (input: RunAgentInput): Promise<AgentOutcome> => {
      await new Promise<void>((resolve) =>
        input.signal.addEventListener("abort", () => resolve()),
      );
      return {
        ok: false,
        failure: { stage: 4, code: "INTERNAL", message: "x" },
      };
    };
    const capture = await runOne(golden, {
      tap,
      runner,
      models: MODELS,
      abortAfterMs: 20,
    });
    tap.stop();
    expect(capture.outcome).toEqual({ ok: false, code: "INTERNAL" });
    expect(capture.durationMs).toBeGreaterThanOrEqual(15);
  });

  it("uses the app's first typed name and its golden slug", async () => {
    const { tap } = setup();
    let seen: RunAgentInput | undefined;
    const runner = async (input: RunAgentInput): Promise<AgentOutcome> => {
      seen = input;
      return {
        ok: false,
        failure: { stage: 0, code: "INTERNAL", message: "x" },
      };
    };
    await runOne(golden, { tap, runner, models: MODELS });
    tap.stop();
    expect(seen).toMatchObject({ app: "Gmail", slug: "gmail" });
    expect(seen?.runId).toMatch(/^eval-gmail-/);
  });
});
