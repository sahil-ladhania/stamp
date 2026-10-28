/**
 * File: run-section.test.ts
 * Purpose: Tests one section's extraction with a mocked strong model: the call, the token cut and the one repair.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import {
  OAUTH_URL,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import {
  STEPS_OUTPUT,
  replyBad,
  replyOk,
} from "../../test-support/extract-replies.js";
import { sectionCtx } from "../../test-support/extract-ctx.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import { indexPages } from "./sanitize.js";
import { SECTION_SCHEMAS } from "./sections.js";
import { runSection } from "./run-section.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
const warn = vi.spyOn(logger, "warn");

beforeEach(() => {
  model.mockReset();
  warn.mockReset().mockImplementation(() => {});
});

describe("runSection success", () => {
  it("asks the strong model once, with the section's schema, name, window, meter and signal", async () => {
    const { ctx } = sectionCtx({ signal: new AbortController().signal });
    model.mockResolvedValue(replyOk(STEPS_OUTPUT));
    await runSection("steps", ctx);
    expect(model).toHaveBeenCalledTimes(1);
    expect(model).toHaveBeenCalledWith(
      "strong",
      expect.objectContaining({
        schema: SECTION_SCHEMAS.steps,
        name: "extract_steps",
        timeoutMs: 25_000,
        usage: ctx.usage,
        runId: "run_1",
        signal: ctx.signal,
      }),
    );
  });

  it("returns the cleaned output with its token counts, call count and excerpt size", async () => {
    const { ctx } = sectionCtx();
    model.mockResolvedValue(replyOk(STEPS_OUTPUT));
    const result = await runSection("steps", ctx);
    expect(result).toMatchObject({
      section: "steps",
      status: "drafted",
      reason: null,
      calls: 1,
      repaired: false,
      inputTokens: 1_000,
      outputTokens: 200,
      dropped: 0,
    });
    expect(result.output).toEqual(STEPS_OUTPUT);
    expect(result.excerptChars).toBeGreaterThan(0);
  });

  it("reports how long the section took on the run clock", async () => {
    const { ctx, time } = sectionCtx();
    model.mockImplementation(async () => {
      time.now += 4_200;
      return replyOk(STEPS_OUTPUT);
    });
    expect((await runSection("steps", ctx)).durationMs).toBe(4_200);
  });

  it("sends relevant excerpts, not the whole pages", async () => {
    const filler = Array.from(
      { length: 400 },
      (_, i) =>
        `Marketing paragraph ${i} about our company culture and offices.`,
    ).join("\n\n");
    const big = pageRecord(
      OAUTH_URL,
      "official",
      `${filler}\n\nCopy the client ID and the client secret.\n\n${filler}`,
    );
    const { ctx } = sectionCtx({ pages: [big], index: indexPages([big]) });
    model.mockResolvedValue(replyOk(STEPS_OUTPUT));
    await runSection("steps", ctx);
    const user = model.mock.calls[0]?.[1].messages[1]?.content ?? "";
    expect(big.text.length).toBeGreaterThan(40_000);
    expect(user.length).toBeLessThan(2_500);
    expect(user).toContain("Copy the client ID and the client secret.");
    expect(user).not.toContain("Marketing paragraph 200");
  });

  it("asks for the verdict with a smaller excerpt budget and the numbered steps in front", async () => {
    const { ctx } = sectionCtx({ context: "Steps:\n0. Create the app" });
    model.mockResolvedValue(
      replyOk({
        summary: claim(OAUTH_URL, QUOTES.secret),
        nextStepIndex: 0,
        topBlockerIndex: null,
      }),
    );
    const result = await runSection("verdict", {
      ...ctx,
      stepCount: 1,
      blockerCount: 0,
    });
    expect(model.mock.calls[0]?.[1].messages[1]?.content).toContain(
      "Steps:\n0. Create the app",
    );
    expect(result.output).toMatchObject({
      nextStepIndex: 0,
      topBlockerIndex: null,
    });
  });
});

describe("runSection repair", () => {
  it("sends one repair request with the bad reply and the error, and uses its answer", async () => {
    const { ctx } = sectionCtx();
    model
      .mockResolvedValueOnce(
        replyBad(
          "schema_mismatch",
          "steps: expected array",
          '{"steps": "oops"}',
        ),
      )
      .mockResolvedValueOnce(replyOk(STEPS_OUTPUT));
    const result = await runSection("steps", ctx);
    expect(model).toHaveBeenCalledTimes(2);
    const second = model.mock.calls[1]?.[1];
    expect(second?.name).toBe("extract_steps_repair");
    expect(second?.messages.at(-2)).toEqual({
      role: "assistant",
      content: '{"steps": "oops"}',
    });
    expect(second?.messages.at(-1)?.content).toContain("steps: expected array");
    expect(result).toMatchObject({
      status: "drafted",
      repaired: true,
      calls: 2,
      inputTokens: 1_900,
      outputTokens: 250,
    });
  });

  it.each(["invalid_json", "empty_response", "truncated"] as const)(
    "repairs once after %s too",
    async (failure) => {
      const { ctx } = sectionCtx();
      model
        .mockResolvedValueOnce(replyBad(failure, "bad"))
        .mockResolvedValueOnce(replyOk(STEPS_OUTPUT));
      expect((await runSection("steps", ctx)).status).toBe("drafted");
    },
  );

  it("marks the section failed, not retried a third time, when the repair is also rejected", async () => {
    const { ctx } = sectionCtx();
    model.mockResolvedValue(replyBad("schema_mismatch", "still wrong"));
    const result = await runSection("steps", ctx);
    expect(model).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      status: "failed",
      reason: "schema_failed",
      repaired: true,
      output: null,
    });
    expect(warn).toHaveBeenCalledWith("extract reply rejected", {
      runId: "run_1",
      section: "steps",
      failure: "schema_mismatch",
    });
  });
});
