/**
 * File: verify-judge-memory.test.ts
 * Purpose: Tests that the verify node keeps the support check's verdicts in state, so the retry pass asks only about what is new and cannot overturn an earlier answer.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import { verify } from "../../test-support/verify-helpers.js";
import type { JudgeMemory } from "../verify/judge-memory.js";

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

describe("verifyNode and the support check's memory", () => {
  it("returns the verdicts it got, so the next pass can reuse them", async () => {
    answer([
      { id: "gates.reviewGate", support: "unsupported", aboutProduct: "yes" },
    ]);
    const { update } = await verify({ gates: GATES_OUTPUT });
    const kept = Object.values(update.supportVerdicts ?? {});
    expect(kept.length).toBeGreaterThan(2);
    expect(kept.some((v) => v.support === "unsupported")).toBe(true);
  });

  it("asks nothing on the retry pass when nothing changed, and keeps the earlier removal", async () => {
    answer([
      { id: "gates.reviewGate", support: "unsupported", aboutProduct: "yes" },
    ]);
    const first = await verify({ gates: GATES_OUTPUT });
    model.mockReset();
    answer([]);
    const second = await verify({
      gates: GATES_OUTPUT,
      retryCount: 1,
      supportVerdicts: first.update.supportVerdicts as JudgeMemory,
    });
    expect(model).not.toHaveBeenCalled();
    expect(second.update.gates).toMatchObject({
      reviewGate: "unknown",
      reviewGateEvidence: null,
    });
  });

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

  it("returns no verdicts to keep, and marks the run partial, when the check could not run", async () => {
    model.mockImplementation(() => Promise.reject(new Error("down")));
    const { update } = await verify({ gates: GATES_OUTPUT });
    expect(update.partial).toBe(true);
    expect(update.supportVerdicts).toBeUndefined();
  });
});
