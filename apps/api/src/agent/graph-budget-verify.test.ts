/**
 * File: graph-budget-verify.test.ts
 * Purpose: Tests that a budget stop with unchecked drafts runs verify, then score, then save, in that order, and skips verify when there are none.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger.js";
import { PAGES } from "../test-support/extract-fixtures.js";
import { GATES_OUTPUT } from "../test-support/extract-replies.js";
import {
  createHarness,
  recorded,
  trace,
} from "../test-support/graph-harness.js";
import { DRAFTS } from "../test-support/guide-fixtures.js";
import { APP } from "../test-support/node-fixtures.js";
import { verifyNode } from "./nodes/verify.js";
import { isPartial, type NodeName } from "./pipeline.js";

vi.spyOn(logger, "info").mockImplementation(() => {});

const stage = (n: number): string[] => [
  `stage.started:${n}`,
  `stage.done:${n}`,
];

/** Fetch stand-in that hands over pages and drafts, then leaves no time at all. */
const fetchThenNoTime = (
  h: ReturnType<typeof createHarness>,
  withDrafts: boolean,
) =>
  recorded("fetch", () => {
    h.setRemaining(0);
    return Promise.resolve(
      withDrafts
        ? { app: APP, pages: PAGES, drafts: DRAFTS, gates: GATES_OUTPUT }
        : {},
    );
  }).fn;

describe("a budget stop with drafts", () => {
  it("runs verify before score and save, and skips the stages in between", async () => {
    const h = createHarness();
    const order: NodeName[] = [];
    const mark = (node: NodeName) =>
      recorded(node, () => {
        order.push(node);
        return Promise.resolve({});
      }).fn;
    const final = await h.run({
      fetch: fetchThenNoTime(h, true),
      verify: mark("verify"),
      score: mark("score"),
      save: mark("save"),
    });
    expect(order).toEqual(["verify", "score", "save"]);
    expect(trace(h.events)).toEqual([
      ...[0, 1, 2, 3].flatMap(stage),
      ...[5, 7, 8].flatMap(stage),
    ]);
    expect(final.completed).toEqual([0, 1, 2, 3, 5, 7, 8]);
    expect(isPartial(final)).toBe(true);
  });

  it("hands score the claims and checked gates the real verify produced", async () => {
    const h = createHarness();
    const score = recorded("score");
    const final = await h.run({
      fetch: fetchThenNoTime(h, true),
      verify: verifyNode,
      score: score.fn,
    });
    expect(score.calls[0]?.claims.some((c) => c.label === "sourced")).toBe(
      true,
    );
    expect(score.calls[0]?.gates?.reviewGate).toBe("required_to_scale");
    expect(score.calls[0]?.checks.length).toBeGreaterThan(0);
    expect(final.failure).toBeNull();
  });

  it("does not loop: verify runs once even though the probe check then fails too", async () => {
    const h = createHarness();
    const verify = recorded("verify");
    await h.run({ fetch: fetchThenNoTime(h, true), verify: verify.fn });
    expect(verify.calls).toHaveLength(1);
  });
});

describe("a budget stop with no drafts", () => {
  it("goes straight to score and save without verify", async () => {
    const h = createHarness();
    const verify = recorded("verify");
    await h.run({ fetch: fetchThenNoTime(h, false), verify: verify.fn });
    expect(verify.calls).toHaveLength(0);
    expect(trace(h.events)).toEqual([
      ...[0, 1, 2, 3].flatMap(stage),
      ...[7, 8].flatMap(stage),
    ]);
  });
});
