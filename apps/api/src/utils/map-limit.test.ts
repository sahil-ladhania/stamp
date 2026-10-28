/**
 * File: map-limit.test.ts
 * Purpose: Tests the concurrency limit, result order, error and abort behaviour of mapLimit.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { mapLimit } from "./map-limit.js";

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("mapLimit", () => {
  it("returns results in input order, whatever order the calls finish in", async () => {
    const out = await mapLimit([30, 5, 15], 3, async (ms, i) => {
      await tick(ms);
      return `${i}:${ms}`;
    });
    expect(out).toEqual(["0:30", "1:5", "2:15"]);
  });

  it("never runs more than the limit at once", async () => {
    let running = 0;
    let peak = 0;
    await mapLimit(
      Array.from({ length: 9 }, (_, i) => i),
      3,
      async () => {
        running += 1;
        peak = Math.max(peak, running);
        await tick(5);
        running -= 1;
      },
    );
    expect(peak).toBe(3);
  });

  it("runs everything when the limit is above the item count", async () => {
    expect(await mapLimit([1, 2], 10, (n) => Promise.resolve(n * 2))).toEqual([
      2, 4,
    ]);
  });

  it("returns an empty list for no items without calling fn", async () => {
    let calls = 0;
    expect(
      await mapLimit([], 4, () => {
        calls += 1;
        return Promise.resolve(1);
      }),
    ).toEqual([]);
    expect(calls).toBe(0);
  });

  it("rejects an invalid limit", async () => {
    await expect(mapLimit([1], 0, () => Promise.resolve(1))).rejects.toThrow(
      RangeError,
    );
    await expect(mapLimit([1], 1.5, () => Promise.resolve(1))).rejects.toThrow(
      RangeError,
    );
  });

  it("rejects with the first error from fn", async () => {
    await expect(
      mapLimit([1, 2, 3], 2, (n) =>
        n === 2 ? Promise.reject(new Error("boom")) : Promise.resolve(n),
      ),
    ).rejects.toThrow("boom");
  });

  it("starts no new call after an abort and throws the abort reason", async () => {
    const controller = new AbortController();
    const started: number[] = [];
    const reason = new Error("stop");
    const running = mapLimit(
      [1, 2, 3, 4],
      1,
      async (n) => {
        started.push(n);
        controller.abort(reason);
        await tick(1);
      },
      controller.signal,
    );
    await expect(running).rejects.toBe(reason);
    expect(started).toEqual([1]);
  });

  it("throws at once for a signal that was already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    await expect(
      mapLimit(
        [1],
        1,
        () => {
          calls += 1;
          return Promise.resolve(1);
        },
        controller.signal,
      ),
    ).rejects.toBeDefined();
    expect(calls).toBe(0);
  });
});
