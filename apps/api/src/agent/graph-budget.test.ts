/**
 * File: graph-budget.test.ts
 * Purpose: Tests that an exhausted time budget routes the run to score and then save as a partial run, checked before each node.
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
import { isPartial, type NodeName } from "./pipeline.js";

const stage = (n: number): string[] => [
  `stage.started:${n}`,
  `stage.done:${n}`,
];

describe("budget routing to score, then save", () => {
  it("sends a run with no time at all straight to score, then save", async () => {
    const h = createHarness();
    h.setRemaining(0);
    const resolve = recorded("resolve");
    const final = await h.run({ resolve: resolve.fn });
    expect(resolve.calls).toHaveLength(0);
    expect(trace(h.events)).toEqual([...stage(7), ...stage(8)]);
    expect(final.completed).toEqual([7, 8]);
    expect(isPartial(final)).toBe(true);
    expect(final.failure).toBeNull();
  });

  it("skips extract, verify and probe when fetch leaves under 15 s, but runs score and save", async () => {
    const h = createHarness();
    const extract = recorded("extract");
    const score = recorded("score");
    const save = recorded("save");
    const final = await h.run({
      fetch: recorded("fetch", () => {
        h.setRemaining(NODE_MIN_REMAINING_MS.extract - 1);
        return Promise.resolve({});
      }).fn,
      extract: extract.fn,
      score: score.fn,
      save: save.fn,
    });
    expect(trace(h.events)).toEqual([
      ...[0, 1, 2, 3].flatMap(stage),
      ...stage(7),
      ...stage(8),
    ]);
    expect(extract.calls).toHaveLength(0);
    expect(score.calls).toHaveLength(1);
    expect(save.calls).toHaveLength(1);
    expect(final.completed).toEqual([0, 1, 2, 3, 7, 8]);
    expect(isPartial(final)).toBe(true);
  });

  it("runs score before save, never save before score", async () => {
    const h = createHarness();
    const order: NodeName[] = [];
    const mark = (node: NodeName) =>
      recorded(node, () => {
        order.push(node);
        return Promise.resolve({});
      }).fn;
    await h.run({
      fetch: recorded("fetch", () => {
        h.setRemaining(0);
        return Promise.resolve({});
      }).fn,
      score: mark("score"),
      save: mark("save"),
    });
    expect(order).toEqual(["score", "save"]);
  });

  it("hands score the state as the run left it, with no gates or claims yet", async () => {
    const h = createHarness();
    const score = recorded("score");
    await h.run({
      plan: recorded("plan", () => Promise.resolve({ queries: ["q1"] })).fn,
      fetch: recorded("fetch", () => {
        h.setRemaining(0);
        return Promise.resolve({});
      }).fn,
      score: score.fn,
    });
    expect(score.calls[0]).toMatchObject({
      queries: ["q1"],
      gates: null,
      claims: [],
      difficulty: null,
    });
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

  it("still runs verify with no time left, because it is code only, then skips probe", async () => {
    const h = createHarness();
    await h.run({
      extract: recorded("extract", () => {
        h.setRemaining(0);
        return Promise.resolve({});
      }).fn,
    });
    expect(trace(h.events)).toEqual([
      ...[0, 1, 2, 3, 4, 5].flatMap(stage),
      ...stage(7),
      ...stage(8),
    ]);
  });

  it("skips only the probe when under 3 s remain after verify: score still runs", async () => {
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
    expect(score.calls).toHaveLength(1);
    expect(final.completed).toEqual([0, 1, 2, 3, 4, 5, 7, 8]);
    expect(isPartial(final)).toBe(true);
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
    expect(trace(h.events)).toEqual([...stage(0), ...stage(7), ...stage(8)]);
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
      ...stage(7),
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
