/**
 * File: emit.test.ts
 * Purpose: Tests the emit helper and the deps lookup it relies on.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { createHarness } from "../test-support/graph-harness.js";
import { getDeps } from "./deps.js";
import { emit } from "./emit.js";

describe("getDeps", () => {
  it("returns the deps from the graph config", () => {
    const h = createHarness();
    expect(getDeps(h.config)).toBe(h.deps);
  });

  const valid = {
    runId: "r",
    emit: (): void => {},
    now: (): number => 0,
    clock: {},
    usage: {},
  };

  it.each([
    ["no configurable", {}],
    ["no deps", { configurable: {} }],
    ["deps that is not an object", { configurable: { deps: "x" } }],
    [
      "deps missing emit",
      { configurable: { deps: { ...valid, emit: undefined } } },
    ],
    [
      "deps with a non-string run id",
      { configurable: { deps: { ...valid, runId: 1 } } },
    ],
    [
      "deps missing the clock",
      { configurable: { deps: { ...valid, clock: undefined } } },
    ],
  ])("throws for %s", (_name, config) => {
    expect(() => getDeps(config)).toThrow("without the run's dependencies");
  });
});

describe("emit", () => {
  it("sends the event with the run id filled in", async () => {
    const h = createHarness();
    await emit(h.config, {
      type: "search.query",
      query: "notion oauth scopes",
    });
    expect(h.events).toEqual([
      { type: "search.query", runId: "run_1", query: "notion oauth scopes" },
    ]);
  });

  it("keeps events in the order they were emitted", async () => {
    const h = createHarness();
    await emit(h.config, { type: "search.query", query: "one" });
    await emit(h.config, { type: "search.query", query: "two" });
    expect(
      h.events.map((event) => ("query" in event ? event.query : "")),
    ).toEqual(["one", "two"]);
  });

  it("emits nothing and throws the abort reason after the run was aborted", async () => {
    const h = createHarness();
    const reason = new Error("executor gave up");
    h.controller.abort(reason);
    await expect(
      emit(h.config, { type: "search.query", query: "late" }),
    ).rejects.toBe(reason);
    expect(h.events).toEqual([]);
  });

  it("waits for the stream to take the event before resolving", async () => {
    const h = createHarness();
    let published = false;
    h.deps.emit = async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      published = true;
    };
    await emit(h.config, { type: "search.query", query: "slow" });
    expect(published).toBe(true);
  });
});
