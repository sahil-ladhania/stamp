/**
 * File: run-section-errors.test.ts
 * Purpose: Tests one section's failure paths with a mocked model: a 429 retry, errors, time limits, abort and an obeyed injection.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { ModelCallError } from "../../lib/openai-client.js";
import { structured } from "../../lib/openai.js";
import { TimeoutError } from "../../utils/with-timeout.js";
import { STEPS_OUTPUT, replyOk } from "../../test-support/extract-replies.js";
import { sectionCtx } from "../../test-support/extract-ctx.js";
import { runSection } from "./run-section.js";
import { MIN_MODEL_CALL_MS } from "./section-types.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
// The rate-limit retry waits for real; make that instant.
vi.mock("../../utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));
const model = vi.mocked(structured);
const warn = vi.spyOn(logger, "warn");
const limited = () =>
  new ModelCallError("gpt-4.1", 429, {
    cause: { headers: { "retry-after": "2" } },
  });

beforeEach(() => {
  model.mockReset();
  warn.mockReset().mockImplementation(() => {});
});

describe("runSection on a 429", () => {
  it("retries once after the backoff and uses the answer", async () => {
    const { ctx } = sectionCtx();
    model
      .mockRejectedValueOnce(limited())
      .mockResolvedValueOnce(replyOk(STEPS_OUTPUT));
    const result = await runSection("steps", ctx);
    expect(model).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ status: "drafted", calls: 1 });
    expect(warn).toHaveBeenCalledWith("model rate limited, retrying once", {
      runId: "run_1",
      name: "extract_steps",
      delayMs: 2000,
    });
  });

  it("fails the section as rate_limited when the retry is limited too", async () => {
    const { ctx } = sectionCtx();
    model.mockRejectedValue(limited());
    expect(await runSection("steps", ctx)).toMatchObject({
      status: "failed",
      reason: "rate_limited",
    });
    expect(model).toHaveBeenCalledTimes(2);
  });

  it("does not wait for a retry when the window has no time left for it", async () => {
    const { ctx } = sectionCtx({}, MIN_MODEL_CALL_MS + 1_000);
    model.mockRejectedValue(limited());
    const result = await runSection("steps", ctx);
    expect(model).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: "failed", reason: "rate_limited" });
  });

  it("shortens the retry's call limit to what is left of the window", async () => {
    const { ctx, time } = sectionCtx({}, 12_000);
    model.mockImplementationOnce(async () => {
      time.now += 4_000;
      throw limited();
    });
    model.mockResolvedValueOnce(replyOk(STEPS_OUTPUT));
    await runSection("steps", ctx);
    expect(model.mock.calls[0]?.[1].timeoutMs).toBe(12_000);
    expect(model.mock.calls[1]?.[1].timeoutMs).toBe(8_000);
  });
});

describe("runSection errors", () => {
  it.each([
    ["a timeout", new TimeoutError("OpenAI extract_steps", 25_000), "timeout"],
    ["a server error", new ModelCallError("gpt-4.1", 500), "model_error"],
    ["an auth error", new ModelCallError("gpt-4.1", 401), "model_error"],
    ["an unexpected error", new Error("boom"), "model_error"],
  ])(
    "fails the section after %s, with no repair",
    async (_name, err, reason) => {
      const { ctx } = sectionCtx();
      model.mockRejectedValue(err);
      expect(await runSection("steps", ctx)).toMatchObject({
        status: "failed",
        reason,
        output: null,
      });
      expect(model).toHaveBeenCalledTimes(1);
    },
  );

  it("does not log the error's cause or message", async () => {
    const { ctx } = sectionCtx();
    model.mockRejectedValue(
      new ModelCallError("gpt-4.1", 401, { cause: { apiKey: "sk-secret" } }),
    );
    await runSection("steps", ctx);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("sk-secret");
  });

  it("lets an abort through instead of returning a failed section", async () => {
    const controller = new AbortController();
    const { ctx } = sectionCtx({ signal: controller.signal });
    model.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new Error("aborted"));
    });
    await expect(runSection("steps", ctx)).rejects.toBeDefined();
  });
});

describe("runSection time", () => {
  it("does not call the model, and fails as time_budget, when under 5 s of the window remain", async () => {
    const { ctx } = sectionCtx({}, MIN_MODEL_CALL_MS - 1);
    expect(await runSection("steps", ctx)).toMatchObject({
      status: "failed",
      reason: "time_budget",
      calls: 0,
    });
    expect(model).not.toHaveBeenCalled();
  });

  it("limits one call to 25 s, and to what is left when the window is shorter", async () => {
    const wide = sectionCtx({}, 40_000);
    const narrow = sectionCtx({}, 9_000);
    model.mockResolvedValue(replyOk(STEPS_OUTPUT));
    await runSection("steps", wide.ctx);
    await runSection("steps", narrow.ctx);
    expect(model.mock.calls.map(([, o]) => o.timeoutMs)).toEqual([
      25_000, 9_000,
    ]);
  });

  it("skips the repair as time_budget when the first reply used up the window", async () => {
    const { ctx, time } = sectionCtx({}, 12_000);
    model.mockImplementationOnce(async () => {
      time.now += 9_000;
      return {
        ok: false as const,
        failure: "schema_mismatch" as const,
        message: "bad",
        raw: "{}",
        model: "m",
        durationMs: 9_000,
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      };
    });
    const result = await runSection("steps", ctx);
    expect(model).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: "failed",
      reason: "time_budget",
      repaired: false,
    });
  });
});
