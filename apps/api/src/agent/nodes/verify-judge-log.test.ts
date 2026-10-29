/**
 * File: verify-judge-memory.test.ts
 * Purpose: Tests that the verify summary lists the items the support check removed a label from.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import { verify } from "../../test-support/verify-helpers.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
vi.spyOn(logger, "info").mockImplementation(() => {});
vi.spyOn(logger, "warn").mockImplementation(() => {});
const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };
const answer = (verdicts: unknown[]) =>
  model.mockResolvedValue({
    ok: true,
    data: { verdicts },
    model: "m",
    durationMs: 5,
    usage,
  } as never);

beforeEach(() => {
  model.mockReset();
});

describe("verifyNode and the support check's log", () => {
  it("logs which items the check removed a label from, by id", async () => {
    answer([{ id: "steps.0.detail", support: "partly", aboutProduct: "yes" }]);
    const info = vi.mocked(logger.info);
    info.mockClear();
    await verify({ gates: GATES_OUTPUT });
    const line = info.mock.calls.find(
      ([m]) => m === "verify summary",
    )?.[1] as Record<string, unknown>;
    expect(line.judgeRemoved).toEqual(["steps.0.detail"]);
  });

  it("logs an empty list when the check removed nothing, and when it could not run", async () => {
    answer([]);
    const info = vi.mocked(logger.info);
    info.mockClear();
    await verify({ gates: GATES_OUTPUT });
    const line = info.mock.calls.find(
      ([m]) => m === "verify summary",
    )?.[1] as Record<string, unknown>;
    expect(line.judgeRemoved).toEqual([]);
  });
});
