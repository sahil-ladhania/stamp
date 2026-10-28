/**
 * File: run-events.test.ts
 * Purpose: Tests the per-run event buffer: ordering, waking readers, closing and retention.
 * Exports: (none)
 * Used by: vitest
 */
import type { RunStreamEvent } from "@stamp/schema";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getRunChannel,
  isTerminalEvent,
  openRunChannel,
  publishRunEvent,
  waitForRunEvent,
} from "./run-events.js";

const query = (runId: string, text: string): RunStreamEvent => ({
  type: "search.query",
  runId,
  query: text,
});
const done = (runId: string): RunStreamEvent => ({
  type: "run.done",
  runId,
  slug: "notion",
  status: "done",
});

afterEach(() => {
  vi.useRealTimers();
});

describe("run event channel", () => {
  it("keeps events in publish order", () => {
    openRunChannel("run_order");
    publishRunEvent("run_order", query("run_order", "a"));
    publishRunEvent("run_order", query("run_order", "b"));
    expect(getRunChannel("run_order")?.events).toHaveLength(2);
    expect(getRunChannel("run_order")?.isDone).toBe(false);
  });

  it("wakes a waiting reader on publish", async () => {
    const channel = openRunChannel("run_wake");
    let woke = false;
    const waiting = waitForRunEvent(channel).then(() => {
      woke = true;
    });
    await Promise.resolve();
    expect(woke).toBe(false);
    publishRunEvent("run_wake", query("run_wake", "a"));
    await waiting;
    expect(woke).toBe(true);
    expect(channel.waiters.size).toBe(0);
  });

  it("releases a waiting reader when its signal aborts", async () => {
    const channel = openRunChannel("run_abort");
    const controller = new AbortController();
    const waiting = waitForRunEvent(channel, controller.signal);
    controller.abort();
    await waiting;
    expect(channel.waiters.size).toBe(0);
  });

  it("closes the channel on a terminal event and rejects later publishes", () => {
    openRunChannel("run_close");
    publishRunEvent("run_close", done("run_close"));
    expect(getRunChannel("run_close")?.isDone).toBe(true);
    expect(() =>
      publishRunEvent("run_close", query("run_close", "late")),
    ).toThrow(/No open event channel/);
  });

  it("throws for a run that has no channel", () => {
    expect(() => publishRunEvent("run_missing", done("run_missing"))).toThrow();
  });

  it("drops a finished run's buffer after the retention window", () => {
    vi.useFakeTimers();
    openRunChannel("run_expire");
    publishRunEvent("run_expire", done("run_expire"));
    vi.advanceTimersByTime(10 * 60_000 - 1);
    expect(getRunChannel("run_expire")).toBeDefined();
    vi.advanceTimersByTime(1);
    expect(getRunChannel("run_expire")).toBeUndefined();
  });

  it("stops buffering progress events past the cap but still accepts the terminal one", () => {
    vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const channel = openRunChannel("run_cap");
    for (let i = 0; i < 2100; i += 1) {
      publishRunEvent("run_cap", query("run_cap", String(i)));
    }
    expect(channel.events).toHaveLength(2000);
    publishRunEvent("run_cap", done("run_cap"));
    expect(channel.events.at(-1)?.type).toBe("run.done");
    vi.restoreAllMocks();
  });
});

describe("isTerminalEvent", () => {
  it("is true only for run.done and run.error", () => {
    expect(isTerminalEvent(done("r"))).toBe(true);
    expect(
      isTerminalEvent({
        type: "run.error",
        runId: "r",
        stage: 0,
        code: "INTERNAL",
        message: "x",
      }),
    ).toBe(true);
    expect(isTerminalEvent(query("r", "q"))).toBe(false);
  });
});
