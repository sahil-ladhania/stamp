/**
 * File: stage-node.test.ts
 * Purpose: Tests the stage wrapper: event order, duration, completion record, failure and abort behaviour.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import {
  createHarness,
  makeState,
  trace,
} from "../test-support/graph-harness.js";
import { noop, stageNode } from "./stage-node.js";

describe("stageNode", () => {
  it("emits stage.started, runs the body, then emits stage.done", async () => {
    const h = createHarness();
    const body = vi.fn(() => {
      expect(trace(h.events)).toEqual(["stage.started:2"]);
      return Promise.resolve({});
    });
    await stageNode("search", body)(makeState(), h.config);
    expect(body).toHaveBeenCalledTimes(1);
    expect(trace(h.events)).toEqual(["stage.started:2", "stage.done:2"]);
  });

  it("names the stage from the schema and tags both events with the run id", async () => {
    const h = createHarness();
    await stageNode("fetch", noop)(makeState(), h.config);
    expect(h.events).toEqual([
      { type: "stage.started", runId: "run_1", stage: 3, name: "fetch_pages" },
      { type: "stage.done", runId: "run_1", stage: 3, durationMs: 0 },
    ]);
  });

  it("reports how long the body took on the run clock", async () => {
    const h = createHarness();
    await stageNode("extract", () => {
      h.advance(1234);
      return Promise.resolve({});
    })(makeState(), h.config);
    expect(h.events[1]).toMatchObject({ type: "stage.done", durationMs: 1234 });
  });

  it("passes the state and config to the body and keeps its update", async () => {
    const h = createHarness();
    const a = { topic: "setup" as const, text: "a" };
    const b = { topic: "scopes" as const, text: "b" };
    const state = makeState({ queries: [a] });
    const body = vi.fn(() => Promise.resolve({ queries: [a, b] }));
    const update = await stageNode("plan", body)(state, h.config);
    expect(body).toHaveBeenCalledWith(state, h.config);
    expect(update).toEqual({ queries: [a, b], completed: [1] });
  });

  it("marks only its own stage completed", async () => {
    const h = createHarness();
    expect(await stageNode("probe", noop)(makeState(), h.config)).toEqual({
      completed: [6],
    });
  });

  it("does not emit stage.done or mark completion when the body fails the run", async () => {
    const h = createHarness();
    const failure = {
      stage: 3,
      code: "NO_PUBLIC_DOCS" as const,
      message: "none",
    };
    const update = await stageNode("fetch", () => Promise.resolve({ failure }))(
      makeState(),
      h.config,
    );
    expect(trace(h.events)).toEqual(["stage.started:3"]);
    expect(update).toEqual({ failure });
  });

  it("does not run the body when the run was already aborted", async () => {
    const h = createHarness();
    h.controller.abort();
    const body = vi.fn(() => Promise.resolve({}));
    await expect(
      stageNode("plan", body)(makeState(), h.config),
    ).rejects.toThrow();
    expect(body).not.toHaveBeenCalled();
    expect(h.events).toEqual([]);
  });

  it("emits no stage.done if the run is aborted while the body works", async () => {
    const h = createHarness();
    await expect(
      stageNode("fetch", () => {
        h.controller.abort();
        return Promise.resolve({});
      })(makeState(), h.config),
    ).rejects.toThrow();
    expect(trace(h.events)).toEqual(["stage.started:3"]);
  });

  it("lets an error from the body through and emits no stage.done", async () => {
    const h = createHarness();
    await expect(
      stageNode("score", () => Promise.reject(new Error("boom")))(
        makeState(),
        h.config,
      ),
    ).rejects.toThrow("boom");
    expect(trace(h.events)).toEqual(["stage.started:7"]);
  });
});
