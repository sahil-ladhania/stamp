/**
 * File: graph-retry.test.ts
 * Purpose: Tests the one conditional edge, verify -> search: it fires only for a missing section, only once, and only with time left.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  createHarness,
  recorded,
  trace,
} from "../test-support/graph-harness.js";
import { RETRY_MIN_REMAINING_MS } from "./budget.js";

const stage = (n: number): string[] => [
  `stage.started:${n}`,
  `stage.done:${n}`,
];
const pass = [2, 3, 4, 5].flatMap(stage);
const missing = () => Promise.resolve({ missingSections: ["steps"] });

describe("retry edge", () => {
  it("does not fire when verify finds nothing missing", async () => {
    const h = createHarness();
    const search = recorded("search");
    await h.run({ search: search.fn });
    expect(search.calls).toHaveLength(1);
    expect(h.events).toHaveLength(18);
  });

  it("fires once when a section has no matched quote: stages 2 to 5 run twice", async () => {
    const h = createHarness();
    const final = await h.run({ verify: recorded("verify", missing).fn });
    expect(trace(h.events)).toEqual([
      ...[0, 1].flatMap(stage),
      ...pass,
      ...pass,
      ...[6, 7, 8].flatMap(stage),
    ]);
    expect(final.retryCount).toBe(1);
  });

  it("fires at most once even if verify reports a missing section on every pass", async () => {
    const h = createHarness();
    const nodes = {
      search: recorded("search"),
      fetch: recorded("fetch"),
      extract: recorded("extract"),
      verify: recorded("verify", missing),
      probe: recorded("probe"),
    };
    await h.run({
      search: nodes.search.fn,
      fetch: nodes.fetch.fn,
      extract: nodes.extract.fn,
      verify: nodes.verify.fn,
      probe: nodes.probe.fn,
    });
    expect(nodes.search.calls).toHaveLength(2);
    expect(nodes.fetch.calls).toHaveLength(2);
    expect(nodes.extract.calls).toHaveLength(2);
    expect(nodes.verify.calls).toHaveLength(2);
    expect(nodes.probe.calls).toHaveLength(1);
  });

  it("counts the retry from search: the retry pass sees the missing sections and retryCount 1 after search", async () => {
    const h = createHarness();
    const search = recorded("search");
    const verify = recorded("verify", missing);
    const extract = recorded("extract");
    await h.run({ search: search.fn, verify: verify.fn, extract: extract.fn });
    expect(search.calls.map((s) => [s.retryCount, s.missingSections])).toEqual([
      [0, []],
      [0, ["steps"]],
    ]);
    expect(extract.calls.map((s) => s.retryCount)).toEqual([0, 1]);
    expect(verify.calls.map((s) => s.retryCount)).toEqual([0, 1]);
  });

  it("does not leave the run partial just because it retried", async () => {
    const h = createHarness();
    const final = await h.run({ verify: recorded("verify", missing).fn });
    expect(final.completed).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(final.partial).toBe(false);
  });
});

describe("retry edge and time", () => {
  it("fires with exactly 40 s left", async () => {
    const run = createHarness();
    const verify = recorded("verify", () => {
      run.setRemaining(RETRY_MIN_REMAINING_MS);
      return missing();
    });
    await run.run({ verify: verify.fn });
    expect(verify.calls).toHaveLength(2);
  });

  it("is skipped with one millisecond less, and the run goes on to probe", async () => {
    const run = createHarness();
    const verify = recorded("verify", () => {
      run.setRemaining(RETRY_MIN_REMAINING_MS - 1);
      return missing();
    });
    const final = await run.run({ verify: verify.fn });
    expect(verify.calls).toHaveLength(1);
    expect(trace(run.events)).toEqual(
      [0, 1, 2, 3, 4, 5, 6, 7, 8].flatMap(stage),
    );
    expect(final.retryCount).toBe(0);
  });

  it("saves a partial run when the retry pass runs out of time before extract", async () => {
    const run = createHarness();
    const verify = recorded("verify", missing);
    const retrySearch = recorded("search", (state) => {
      if (state.missingSections.length > 0) {
        run.setRemaining(10_000);
      }
      return Promise.resolve({});
    });
    const extract = recorded("extract");
    const final = await run.run({
      verify: verify.fn,
      search: retrySearch.fn,
      extract: extract.fn,
    });
    expect(extract.calls).toHaveLength(1);
    expect(trace(run.events).slice(-6)).toEqual([
      ...[2, 3].flatMap(stage),
      ...stage(8),
    ]);
    expect(final.completed).toContain(8);
  });
});
