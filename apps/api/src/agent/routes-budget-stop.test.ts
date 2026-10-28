/**
 * File: routes-budget-stop.test.ts
 * Purpose: Tests where a failed budget check sends the run: verify when drafts or gates are unchecked, otherwise score, and never in a loop.
 * Exports: (none)
 * Used by: vitest
 */
import { END } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import { GATES_OUTPUT } from "../test-support/extract-replies.js";
import { createHarness, makeState } from "../test-support/graph-harness.js";
import { DRAFTS } from "../test-support/guide-fixtures.js";
import { NODE_MIN_REMAINING_MS, type BudgetNode } from "./budget.js";
import { hasUnverifiedWork, routeAfterVerify, routeTo } from "./routes.js";

const TIMED: BudgetNode[] = [
  "resolve",
  "plan",
  "search",
  "fetch",
  "extract",
  "probe",
];
const BEFORE_VERIFY = [0, 1, 2, 3, 4] as const;
const THROUGH_VERIFY = [0, 1, 2, 3, 4, 5] as const;

/** The route taken when `node` has one millisecond too little time. */
function stopAt(node: BudgetNode, state = makeState()) {
  const h = createHarness();
  h.setRemaining(NODE_MIN_REMAINING_MS[node] - 1);
  return routeTo(node)(state, h.config);
}

describe("hasUnverifiedWork", () => {
  it("is true for drafted sections that verify has not seen", () => {
    expect(
      hasUnverifiedWork(
        makeState({ drafts: DRAFTS, completed: [...BEFORE_VERIFY] }),
      ),
    ).toBe(true);
  });
  it("is true for gates alone", () => {
    expect(hasUnverifiedWork(makeState({ gates: GATES_OUTPUT }))).toBe(true);
  });
  it("is false once verify has completed", () => {
    expect(
      hasUnverifiedWork(
        makeState({
          drafts: DRAFTS,
          gates: GATES_OUTPUT,
          completed: [...THROUGH_VERIFY],
        }),
      ),
    ).toBe(false);
  });
  it("is false with no drafts and no gates", () => {
    expect(hasUnverifiedWork(makeState())).toBe(false);
  });
  it("is false when no section was drafted: unknown and failed sections hold nothing to check", () => {
    const drafts = {
      steps: { status: "unknown" as const },
      scopes: { status: "failed" as const, reason: "time_budget" },
    };
    expect(hasUnverifiedWork(makeState({ drafts }))).toBe(false);
  });
});

describe("routeTo after a failed budget check", () => {
  it.each(TIMED)(
    "sends a stop at %s through verify when drafts are unchecked",
    (node) => {
      expect(
        stopAt(
          node,
          makeState({ drafts: DRAFTS, completed: [...BEFORE_VERIFY] }),
        ),
      ).toBe("verify");
    },
  );

  it.each(TIMED)(
    "sends a stop at %s straight to score when there are no drafts",
    (node) => {
      expect(stopAt(node)).toBe("score");
    },
  );

  it.each(TIMED)(
    "sends a stop at %s to score, not back to verify, once verify has run",
    (node) => {
      expect(
        stopAt(
          node,
          makeState({ drafts: DRAFTS, completed: [...THROUGH_VERIFY] }),
        ),
      ).toBe("score");
    },
  );

  it("sends a stop with only the gates held through verify", () => {
    expect(stopAt("extract", makeState({ gates: GATES_OUTPUT }))).toBe(
      "verify",
    );
  });

  it("still ends the run on a failure, with unchecked drafts", () => {
    const h = createHarness();
    h.setRemaining(0);
    const failure = { stage: 4, code: "INTERNAL" as const, message: "x" };
    expect(
      routeTo("probe")(makeState({ drafts: DRAFTS, failure }), h.config),
    ).toBe(END);
  });

  it("runs the node when its time check passes, whatever is unchecked", () => {
    const h = createHarness();
    h.setRemaining(NODE_MIN_REMAINING_MS.probe);
    expect(routeTo("probe")(makeState({ drafts: DRAFTS }), h.config)).toBe(
      "probe",
    );
  });
});

describe("routeAfterVerify with little time", () => {
  it("goes to score, never back to verify, when there is no time for the probe", () => {
    const h = createHarness();
    h.setRemaining(NODE_MIN_REMAINING_MS.probe - 1);
    const state = makeState({ drafts: DRAFTS, completed: [...THROUGH_VERIFY] });
    expect(routeAfterVerify(state, h.config)).toBe("score");
  });
});
