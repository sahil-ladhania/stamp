/**
 * File: score.test.ts
 * Purpose: Tests the score node: verified gates, no gates, and gates the budget stopped before verify could check.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import { state } from "../../test-support/extract-node-helpers.js";
import { createHarness, trace } from "../../test-support/graph-harness.js";
import { scoreNode } from "./score.js";

const BEFORE_VERIFY = [0, 1, 2, 3, 4] as const;
const THROUGH_VERIFY = [0, 1, 2, 3, 4, 5] as const;

async function score(over: Parameters<typeof state>[1]) {
  const h = createHarness();
  const update = await scoreNode(state(undefined, over), h.config);
  return { h, update };
}

describe("scoreNode", () => {
  it("scores the verified gates: required review and a 5 to 7 day wait", async () => {
    const { update } = await score({
      gates: GATES_OUTPUT,
      completed: [...THROUGH_VERIFY],
    });
    expect(update.difficulty).toEqual({
      reviewGate: 2,
      approvalWait: 1,
      prerequisites: 1,
      hiddenLimits: 1,
      total: 5,
      score: 3,
    });
    expect(update.archetype).toBe("hidden_limits");
  });

  it("scores missing gates as unknown, with the wait counting 2 and the archetype unknown", async () => {
    const { update } = await score({
      gates: null,
      completed: [...THROUGH_VERIFY],
    });
    expect(update.difficulty).toMatchObject({
      reviewGate: 0,
      approvalWait: 2,
      total: 2,
    });
    expect(update.archetype).toBe("unknown");
  });

  it("scores unchecked gates as unknown when the budget skipped verify", async () => {
    const { update } = await score({
      gates: GATES_OUTPUT,
      completed: [...BEFORE_VERIFY],
    });
    expect(update.difficulty).toMatchObject({
      reviewGate: 0,
      approvalWait: 2,
      prerequisites: 0,
      hiddenLimits: 0,
    });
    expect(update.archetype).toBe("unknown");
  });

  it("scores a run that got nowhere as unknown, without throwing", async () => {
    const { update } = await score({ completed: [] });
    expect(update.difficulty).toMatchObject({ total: 2 });
  });

  it("emits its stage events and marks stage 7 completed", async () => {
    const { h, update } = await score({ completed: [...THROUGH_VERIFY] });
    expect(trace(h.events)).toEqual(["stage.started:7", "stage.done:7"]);
    expect(update.completed).toEqual([7]);
    expect(update.failure).toBeUndefined();
  });
});
