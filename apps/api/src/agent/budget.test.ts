/**
 * File: budget.test.ts
 * Purpose: Tests the run budget: documented limits, clock, node gates and node timeouts.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  NODE_CAP_MS,
  NODE_MIN_REMAINING_MS,
  RETRY_NODE_CAP_MS,
  RUN_BUDGET,
  checkBudget,
  elapsedMs,
  nodeTimeoutMs,
  remainingMs,
  startBudget,
  type BudgetNode,
} from "./budget.js";

const T0 = 1_000_000;
const clock = startBudget(T0);
const at = (secondsIn: number): number => T0 + secondsIn * 1000;
const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

describe("the documented limits", () => {
  it("keeps the fixed budget from docs/agent-architecture.md", () => {
    expect(RUN_BUDGET).toEqual({
      maxDurationMs: 120_000,
      maxPages: 6,
      maxRetries: 1,
      maxSchemaRepairsPerSection: 1,
    });
  });

  it("keeps the first pass at 84 s and the retry path at 118 s, both within 120 s", () => {
    const firstPass = sum(Object.values(NODE_CAP_MS));
    const retryPass = sum(
      Object.values(RETRY_NODE_CAP_MS).filter(
        (ms): ms is number => ms !== undefined,
      ),
    );
    expect(firstPass).toBe(84_000);
    expect(retryPass).toBe(34_000);
    expect(firstPass + retryPass).toBe(118_000);
    expect(firstPass + retryPass).toBeLessThanOrEqual(RUN_BUDGET.maxDurationMs);
  });

  it("keeps a retry cap at or below its first-pass cap", () => {
    for (const [node, cap] of Object.entries(RETRY_NODE_CAP_MS)) {
      expect(cap).toBeLessThanOrEqual(NODE_CAP_MS[node as BudgetNode]);
    }
  });

  it("never gates a code-only node", () => {
    expect([
      NODE_MIN_REMAINING_MS.verify,
      NODE_MIN_REMAINING_MS.score,
      NODE_MIN_REMAINING_MS.save,
    ]).toEqual([0, 0, 0]);
  });
});

describe("startBudget, elapsedMs, remainingMs", () => {
  it("defaults to the 120 s budget", () => {
    expect(clock).toEqual({ startedAt: T0, maxDurationMs: 120_000 });
  });

  it("lets a caller lower the budget but never raise it", () => {
    expect(startBudget(T0, 30_000).maxDurationMs).toBe(30_000);
    expect(startBudget(T0, 999_999).maxDurationMs).toBe(120_000);
    expect(startBudget(T0, 1500.9).maxDurationMs).toBe(1500);
  });

  it("throws for a budget that is zero, negative or not a number", () => {
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => startBudget(T0, bad)).toThrow(RangeError);
    }
  });

  it("measures elapsed and remaining time", () => {
    expect(elapsedMs(clock, at(0))).toBe(0);
    expect(elapsedMs(clock, at(45))).toBe(45_000);
    expect(remainingMs(clock, at(45))).toBe(75_000);
  });

  it("never reports negative time, even past the budget or before the start", () => {
    expect(remainingMs(clock, at(500))).toBe(0);
    expect(elapsedMs(clock, T0 - 5000)).toBe(0);
    expect(remainingMs(clock, T0 - 5000)).toBe(120_000);
  });
});

describe("checkBudget", () => {
  it("allows a node with enough time left and refuses one without", () => {
    expect(checkBudget(clock, at(0), "extract")).toEqual({ ok: true });
    expect(checkBudget(clock, at(100), "extract")).toEqual({ ok: true });
    expect(checkBudget(clock, at(100.001), "extract")).toEqual({
      ok: false,
      reason: "time_budget",
    });
  });

  it("uses each node's own minimum", () => {
    expect(checkBudget(clock, at(117), "resolve")).toEqual({ ok: true });
    expect(checkBudget(clock, at(118), "resolve")).toEqual({
      ok: false,
      reason: "time_budget",
    });
    expect(checkBudget(clock, at(118), "probe").ok).toBe(false);
  });

  it("always lets verify, score and save run, even with no time left", () => {
    for (const node of ["verify", "score", "save"] as const) {
      expect(checkBudget(clock, at(500), node)).toEqual({ ok: true });
    }
  });
});

describe("nodeTimeoutMs", () => {
  it("is the node's ceiling while plenty of time remains", () => {
    expect(nodeTimeoutMs(clock, at(0), "extract")).toBe(40_000);
    expect(nodeTimeoutMs(clock, at(0), "search")).toBe(8_000);
  });

  it("is cut so verify, score and save still fit", () => {
    expect(nodeTimeoutMs(clock, at(100), "extract")).toBe(12_000);
    expect(nodeTimeoutMs(clock, at(100), "probe")).toBe(4_000);
    expect(nodeTimeoutMs(clock, at(116), "probe")).toBe(0);
  });

  it("never goes negative", () => {
    expect(nodeTimeoutMs(clock, at(500), "extract")).toBe(0);
  });

  it("uses the tighter retry ceiling on the retry pass, and the normal one where there is none", () => {
    expect(nodeTimeoutMs(clock, at(0), "extract", { retryPass: true })).toBe(
      18_000,
    );
    expect(nodeTimeoutMs(clock, at(0), "fetch", { retryPass: true })).toBe(
      8_000,
    );
    expect(nodeTimeoutMs(clock, at(0), "probe", { retryPass: true })).toBe(
      4_000,
    );
  });

  it("gives the final nodes their full ceiling with nothing reserved", () => {
    expect(nodeTimeoutMs(clock, at(110), "save")).toBe(5_000);
    expect(nodeTimeoutMs(clock, at(118), "save")).toBe(2_000);
  });
});
