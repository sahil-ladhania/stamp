/**
 * File: node-timing.test.ts
 * Purpose: Tests the per-call time limit: the node cap, the retry cap, the floor and the time left.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { createHarness } from "../test-support/graph-harness.js";
import { MIN_CALL_MS, callTimeoutMs } from "./node-timing.js";

describe("callTimeoutMs", () => {
  it("is the node's time cap when plenty of time remains", () => {
    const h = createHarness();
    expect(callTimeoutMs(h.config, "resolve")).toBe(6_000);
    expect(callTimeoutMs(h.config, "search")).toBe(8_000);
    expect(callTimeoutMs(h.config, "fetch")).toBe(12_000);
  });

  it("is the smaller cap on the retry pass", () => {
    const h = createHarness();
    expect(callTimeoutMs(h.config, "search", { retryPass: true })).toBe(6_000);
    expect(callTimeoutMs(h.config, "fetch", { retryPass: true })).toBe(8_000);
  });

  it("leaves room for the stages after it", () => {
    const h = createHarness();
    h.setRemaining(12_000);
    expect(callTimeoutMs(h.config, "search")).toBe(4_000);
  });

  it("never drops below the floor while time remains, even when the reserve would make it zero", () => {
    const h = createHarness();
    h.setRemaining(5_000);
    expect(callTimeoutMs(h.config, "search")).toBe(MIN_CALL_MS);
  });

  it("is never more than the time left", () => {
    const h = createHarness();
    h.setRemaining(900);
    expect(callTimeoutMs(h.config, "search")).toBe(900);
    h.setRemaining(0);
    expect(callTimeoutMs(h.config, "search")).toBe(0);
  });
});
