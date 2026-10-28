/**
 * File: routes.test.ts
 * Purpose: Tests the budget check before each node and the retry rule after verify, at their exact thresholds.
 * Exports: (none)
 * Used by: vitest
 */
import { END } from "@langchain/langgraph";
import { describe, expect, it } from "vitest";
import { createHarness, makeState } from "../test-support/graph-harness.js";
import {
  NODE_MIN_REMAINING_MS,
  RETRY_MIN_REMAINING_MS,
  type BudgetNode,
} from "./budget.js";
import {
  isRetryEntry,
  routeAfterVerify,
  routeTo,
  shouldRetry,
} from "./routes.js";

const TIMED: BudgetNode[] = [
  "resolve",
  "plan",
  "search",
  "fetch",
  "extract",
  "probe",
];
const CODE_ONLY: BudgetNode[] = ["verify", "score"];
const failure = { stage: 3, code: "NO_PUBLIC_DOCS" as const, message: "none" };

describe("routeTo", () => {
  it.each(TIMED)("runs %s when its minimum time remains", (node) => {
    const h = createHarness();
    h.setRemaining(NODE_MIN_REMAINING_MS[node]);
    expect(routeTo(node)(makeState(), h.config)).toBe(node);
  });

  it.each(TIMED)(
    "skips to score one millisecond below the minimum for %s",
    (node) => {
      const h = createHarness();
      h.setRemaining(NODE_MIN_REMAINING_MS[node] - 1);
      expect(routeTo(node)(makeState(), h.config)).toBe("score");
    },
  );

  it.each(CODE_ONLY)(
    "still runs the code-only %s with no time left",
    (node) => {
      const h = createHarness();
      h.setRemaining(0);
      expect(routeTo(node)(makeState(), h.config)).toBe(node);
    },
  );

  it("ends the run when a stage reported a failure, whatever the budget", () => {
    const h = createHarness();
    expect(routeTo("plan")(makeState({ failure }), h.config)).toBe(END);
    h.setRemaining(0);
    expect(routeTo("plan")(makeState({ failure }), h.config)).toBe(END);
  });

  it("reads the clock at call time, so the same router reacts to time passing", () => {
    const h = createHarness();
    const route = routeTo("extract");
    expect(route(makeState(), h.config)).toBe("extract");
    h.advance(h.deps.clock.maxDurationMs - 14_999);
    expect(route(makeState(), h.config)).toBe("score");
  });
});

describe("shouldRetry", () => {
  const missing = { missingSections: ["steps"] };

  it("retries when a section is missing, the retry is unused and 40 s remain", () => {
    const h = createHarness();
    h.setRemaining(RETRY_MIN_REMAINING_MS);
    expect(shouldRetry(makeState(missing), h.deps.clock, h.deps.now())).toBe(
      true,
    );
  });

  it("does not retry with one millisecond less than 40 s", () => {
    const h = createHarness();
    h.setRemaining(RETRY_MIN_REMAINING_MS - 1);
    expect(shouldRetry(makeState(missing), h.deps.clock, h.deps.now())).toBe(
      false,
    );
  });

  it("does not retry when no section is missing", () => {
    const h = createHarness();
    expect(shouldRetry(makeState(), h.deps.clock, h.deps.now())).toBe(false);
  });

  it("never retries a second time", () => {
    const h = createHarness();
    const state = makeState({ ...missing, retryCount: 1 });
    expect(shouldRetry(state, h.deps.clock, h.deps.now())).toBe(false);
  });
});

describe("isRetryEntry", () => {
  it("is true only once verify has reported missing sections", () => {
    expect(isRetryEntry(makeState())).toBe(false);
    expect(isRetryEntry(makeState({ missingSections: ["scopes"] }))).toBe(true);
  });
});

describe("routeAfterVerify", () => {
  it("goes back to search for the one retry", () => {
    const h = createHarness();
    expect(
      routeAfterVerify(makeState({ missingSections: ["steps"] }), h.config),
    ).toBe("search");
  });

  it("goes on to probe when every section matched", () => {
    const h = createHarness();
    expect(routeAfterVerify(makeState(), h.config)).toBe("probe");
  });

  it("goes on to probe, not search, once the retry was used", () => {
    const h = createHarness();
    const state = makeState({ missingSections: ["steps"], retryCount: 1 });
    expect(routeAfterVerify(state, h.config)).toBe("probe");
  });

  it("skips the retry when under 40 s remain but still probes if 3 s remain", () => {
    const h = createHarness();
    h.setRemaining(RETRY_MIN_REMAINING_MS - 1);
    expect(
      routeAfterVerify(makeState({ missingSections: ["steps"] }), h.config),
    ).toBe("probe");
  });

  it("goes to score when there is no time left for the probe", () => {
    const h = createHarness();
    h.setRemaining(NODE_MIN_REMAINING_MS.probe - 1);
    expect(routeAfterVerify(makeState(), h.config)).toBe("score");
  });

  it("ends the run on a failure", () => {
    const h = createHarness();
    expect(routeAfterVerify(makeState({ failure }), h.config)).toBe(END);
  });
});
