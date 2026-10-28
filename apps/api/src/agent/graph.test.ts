/**
 * File: graph.test.ts
 * Purpose: Tests the graph end to end with no-op nodes: 18 stage events in order, failure handling and abort.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  createHarness,
  recorded,
  trace,
} from "../test-support/graph-harness.js";
import { PIPELINE, isPartial, type NodeName } from "./pipeline.js";
import { STAGES } from "@stamp/schema";

const ORDER = PIPELINE.map((item) => item.node);
const EXPECTED_TRACE = PIPELINE.flatMap(({ stage }) => [
  `stage.started:${stage}`,
  `stage.done:${stage}`,
]);

describe("graph with no-op nodes", () => {
  it("emits 18 stage events: started then done for stages 0 to 8, in order", async () => {
    const h = createHarness();
    await h.run();
    expect(h.events).toHaveLength(18);
    expect(trace(h.events)).toEqual(EXPECTED_TRACE);
  });

  it("emits nothing but stage events", async () => {
    const h = createHarness();
    await h.run();
    expect(new Set(h.events.map((event) => event.type))).toEqual(
      new Set(["stage.started", "stage.done"]),
    );
  });

  it("names each stage from @stamp/schema and tags every event with the run id", async () => {
    const h = createHarness();
    await h.run();
    const started = h.events.filter((event) => event.type === "stage.started");
    expect(started.map((event) => event.name)).toEqual(
      STAGES.map((stage) => stage.name),
    );
    expect(h.events.every((event) => event.runId === "run_1")).toBe(true);
  });

  it("runs every node body once, in pipeline order", async () => {
    const h = createHarness();
    const order: NodeName[] = [];
    const nodes = Object.fromEntries(
      ORDER.map((name) => [
        name,
        recorded(name, () => {
          order.push(name);
          return Promise.resolve({});
        }).fn,
      ]),
    );
    await h.run(nodes);
    expect(order).toEqual(ORDER);
  });

  it("finishes complete: all stages done, no retry, no failure, not partial", async () => {
    const final = await createHarness().run();
    expect(final.completed).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(final.retryCount).toBe(0);
    expect(final.failure).toBeNull();
    expect(isPartial(final)).toBe(false);
  });
});

describe("a stage that fails the run", () => {
  const failure = {
    stage: 3,
    code: "NO_PUBLIC_DOCS" as const,
    message: "none",
  };

  it("ends the run there: no stage.done for it, no later stage and no save", async () => {
    const h = createHarness();
    const later = ORDER.slice(4).map((name) => [name, recorded(name)] as const);
    const final = await h.run({
      fetch: recorded("fetch", () => Promise.resolve({ failure })).fn,
      ...Object.fromEntries(later.map(([name, node]) => [name, node.fn])),
    });
    expect(trace(h.events)).toEqual([
      ...EXPECTED_TRACE.slice(0, 6),
      "stage.started:3",
    ]);
    expect(final.failure).toEqual(failure);
    expect(later.every(([, node]) => node.calls.length === 0)).toBe(true);
  });

  it("ends the run on a failure at the very first stage", async () => {
    const h = createHarness();
    const final = await h.run({
      resolve: recorded("resolve", () => Promise.resolve({ failure })).fn,
    });
    expect(trace(h.events)).toEqual(["stage.started:0"]);
    expect(final.failure).toEqual(failure);
  });
});

describe("abort", () => {
  it("stops the run and runs no later node", async () => {
    const h = createHarness();
    const fetch = recorded("fetch");
    const search = recorded("search", () => {
      h.controller.abort();
      return Promise.resolve({});
    });
    await expect(
      h.run({ search: search.fn, fetch: fetch.fn }),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetch.calls).toHaveLength(0);
    expect(trace(h.events)).toEqual([
      ...EXPECTED_TRACE.slice(0, 4),
      "stage.started:2",
    ]);
  });

  it("stops a node that is still working, without waiting for it to finish", async () => {
    const h = createHarness();
    const stuck = recorded("extract", () => new Promise(() => {}));
    const after = recorded("verify");
    const running = h.run({ extract: stuck.fn, verify: after.fn });
    const assertion = expect(running).rejects.toMatchObject({
      name: "AbortError",
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    h.controller.abort();
    await assertion;
    expect(after.calls).toHaveLength(0);
    expect(trace(h.events).at(-1)).toBe("stage.started:4");
  });

  it("emits nothing when the run was aborted before it began", async () => {
    const h = createHarness();
    const resolve = recorded("resolve");
    h.controller.abort();
    await expect(h.run({ resolve: resolve.fn })).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(resolve.calls).toHaveLength(0);
    expect(h.events).toEqual([]);
  });
});
