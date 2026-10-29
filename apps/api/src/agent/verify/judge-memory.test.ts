/**
 * File: judge-memory.test.ts
 * Purpose: Tests that the support check keeps its verdicts between verify passes: an unchanged claim and quote is not asked again, a changed one is, and a failed check changes nothing.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import type { JudgeItem } from "../prompts/support-judge.js";
import { itemKey, judgeWithMemory } from "./judge-memory.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
vi.spyOn(logger, "warn").mockImplementation(() => {});
const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };
const reply = (verdicts: unknown[]) =>
  model.mockResolvedValue({
    ok: true,
    data: { verdicts },
    model: "m",
    durationMs: 5,
    usage,
  } as never);
const item = (
  id: string,
  claim = "A claim.",
  quote = "A quote.",
): JudgeItem => ({ id, claim, quote, page: "Page (x.com/p)" });
const app = { appName: "Acme", product: null };
const options = {
  now: () => 0,
  deadline: 10_000,
  usage: undefined,
  runId: "run_1",
};
const asked = () => model.mock.calls.at(-1)?.[1].messages[1]?.content ?? "";

beforeEach(() => {
  model.mockReset();
});

describe("judgeWithMemory", () => {
  it("asks about every item the first time and remembers all the answers, the unproblematic ones too", async () => {
    reply([{ id: "a", support: "partly", aboutProduct: "yes" }]);
    const out = await judgeWithMemory(app, [item("a"), item("b")], options, {});
    expect(out?.verdicts.get("a")).toEqual({
      support: "partly",
      aboutProduct: "yes",
    });
    expect(out?.verdicts.get("b")).toEqual({
      support: "supported",
      aboutProduct: "yes",
    });
    expect(Object.keys(out?.memory ?? {})).toHaveLength(2);
  });

  it("does not ask again about an unchanged claim and quote, and keeps the earlier answer", async () => {
    reply([{ id: "a", support: "unsupported", aboutProduct: "yes" }]);
    const first = await judgeWithMemory(app, [item("a")], options, {});
    model.mockReset();
    const second = await judgeWithMemory(
      app,
      [item("a")],
      options,
      first?.memory ?? {},
    );
    expect(model).not.toHaveBeenCalled();
    expect(second?.verdicts.get("a")).toEqual({
      support: "unsupported",
      aboutProduct: "yes",
    });
  });

  it("keeps a removal even when the model, asked again in a different batch, would accept it", async () => {
    reply([{ id: "a", support: "partly", aboutProduct: "yes" }]);
    const first = await judgeWithMemory(app, [item("a")], options, {});
    reply([]);
    const second = await judgeWithMemory(
      app,
      [item("a"), item("c")],
      options,
      first?.memory ?? {},
    );
    expect(second?.verdicts.get("a")?.support).toBe("partly");
    expect(asked()).not.toContain('<item id="a">');
    expect(asked()).toContain('<item id="c">');
  });

  it("asks again when the quote or the claim changed", async () => {
    reply([]);
    const first = await judgeWithMemory(app, [item("a")], options, {});
    reply([]);
    await judgeWithMemory(
      app,
      [item("a", "A claim.", "A different quote.")],
      options,
      first?.memory ?? {},
    );
    expect(model).toHaveBeenCalledTimes(2);
    expect(itemKey(item("a"))).not.toBe(itemKey(item("a", "Another claim.")));
    expect(itemKey(item("a"))).not.toBe(itemKey(item("b")));
  });

  it("gives back null and the memory untouched when the check cannot run", async () => {
    model.mockImplementation(() => Promise.reject(new Error("down")));
    const memory = {
      known: { support: "supported" as const, aboutProduct: "yes" as const },
    };
    expect(await judgeWithMemory(app, [item("a")], options, memory)).toBeNull();
  });

  it("makes no call and returns nothing to remove when there are no items", async () => {
    const out = await judgeWithMemory(app, [], options, {});
    expect(model).not.toHaveBeenCalled();
    expect(out?.verdicts.size).toBe(0);
  });
});
