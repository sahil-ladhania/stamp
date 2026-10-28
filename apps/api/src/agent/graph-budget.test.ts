/**
 * File: graph-budget.test.ts
 * Purpose: Tests that an exhausted time budget routes the run to save as a partial run, checked before each node.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  createHarness,
  recorded,
  trace,
} from "../test-support/graph-harness.js";
import { NODE_MIN_REMAINING_MS } from "./budget.js";
import { isPartial } from "./pipeline.js";

const stage = (n: number): string[] => [
  `stage.started:${n}`,
  `stage.done:${n}`,
];

describe("budget routing to save", () => {
  it("sends a run with no time at all straight to save", async () => {
    const h = createHarness();
    h.setRemaining(0);
    const resolve = recorded("resolve");
    const final = await h.run({ resolve: resolve.fn });
    expect(resolve.calls).toHaveLength(0);
    expect(trace(h.events)).toEqual(stage(8));
    expect(isPartial(final)).toBe(true);
    expect(final.failure).toBeNull();
  });

  it("skips extract, verify, probe and score when fetch leaves under 15 s", async () => {
    const h = createHarness();
    const extract = recorded("extract");
    const save = recorded("save");
    const final = await h.run({
      fetch: recorded("fetch", () => {
        h.setRemaining(NODE_MIN_REMAINING_MS.extract - 1);
        return Promise.resolve({});
      }).fn,
      extract: extract.fn,
      save: save.fn,
    });
    expect(trace(h.events)).toEqual([
      ...[0, 1, 2, 3].flatMap(stage),
      ...stage(8),
    ]);
    expect(extract.calls).toHaveLength(0);
    expect(save.calls).toHaveLength(1);
    expect(final.completed).toEqual([0, 1, 2, 3, 8]);
    expect(isPartial(final)).toBe(true);
  });

  it("runs extract with exactly 15 s left", async () => {
    const h = createHarness();
    const extract = recorded("extract");
    await h.run({
      fetch: recorded("fetch", () => {
        h.setRemaining(NODE_MIN_REMAINING_MS.extract);
        return Promise.resolve({});
      }).fn,
      extract: extract.fn,
    });
    expect(extract.calls).toHaveLength(1);
  });

  it("still runs verify with no time left, because it is code only, then skips probe and score", async () => {
    const h = createHarness();
    await h.run({
      extract: recorded("extract", () => {
        h.setRemaining(0);
        return Promise.resolve({});
      }).fn,
    });
    expect(trace(h.events)).toEqual([
      ...[0, 1, 2, 3, 4, 5].flatMap(stage),
      ...stage(8),
    ]);
  });

  it("skips only the probe and score when under 3 s remain after verify", async () => {
    const h = createHarness();
    const probe = recorded("probe");
    const score = recorded("score");
    const final = await h.run({
      verify: recorded("verify", () => {
        h.setRemaining(NODE_MIN_REMAINING_MS.probe - 1);
        return Promise.resolve({});
      }).fn,
      probe: probe.fn,
      score: score.fn,
    });
    expect(probe.calls).toHaveLength(0);
    expect(score.calls).toHaveLength(0);
    expect(final.completed).toEqual([0, 1, 2, 3, 4, 5, 8]);
  });

  it("checks the budget before every node, not once: time passing mid-run is noticed", async () => {
    const h = createHarness();
    const after = recorded("plan");
    await h.run({
      resolve: recorded("resolve", () => {
        h.advance(h.deps.clock.maxDurationMs);
        return Promise.resolve({});
      }).fn,
      plan: after.fn,
    });
    expect(after.calls).toHaveLength(0);
    expect(trace(h.events)).toEqual([...stage(0), ...stage(8)]);
  });

  it("honours a budget lowered below 120 s: the same 1.5 s of planning is fine at 120 s", async () => {
    const spend = (h: ReturnType<typeof createHarness>) =>
      recorded("plan", () => {
        h.advance(1_500);
        return Promise.resolve({});
      }).fn;

    const lowered = createHarness({ budgetMs: 5_000 });
    const skipped = recorded("search");
    await lowered.run({ plan: spend(lowered), search: skipped.fn });
    expect(skipped.calls).toHaveLength(0);
    expect(trace(lowered.events)).toEqual([
      ...stage(0),
      ...stage(1),
      ...stage(8),
    ]);

    const normal = createHarness();
    const ran = recorded("search");
    await normal.run({ plan: spend(normal), search: ran.fn });
    expect(ran.calls).toHaveLength(1);
  });

  it("runs the whole pipeline when time stays within budget", async () => {
    const h = createHarness();
    h.setRemaining(NODE_MIN_REMAINING_MS.extract + 1);
    const final = await h.run();
    expect(h.events).toHaveLength(18);
    expect(isPartial(final)).toBe(false);
  });
});
