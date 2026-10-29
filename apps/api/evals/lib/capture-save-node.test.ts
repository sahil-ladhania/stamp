/**
 * File: capture-save-node.test.ts
 * Purpose: Tests the eval's save stage: it hands the final state to the capture, builds the guide, and writes nothing to the database.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { logger } from "../../src/lib/logger.js";
import { createHarness } from "../../src/test-support/graph-harness.js";
import { readyState } from "../../src/test-support/save-helpers.js";
import { captureSaveNode } from "./capture-save-node.js";

vi.mock("../../src/lib/prisma.js", () => ({
  prisma: new Proxy(
    {},
    {
      get: () => {
        throw new Error("the eval save stage must not touch the database");
      },
    },
  ),
}));
const error = vi.spyOn(logger, "error").mockImplementation(() => {});

describe("captureSaveNode", () => {
  it("passes the final state to the capture and returns the built guide", async () => {
    const seen: unknown[] = [];
    const node = captureSaveNode((state) => seen.push(state));
    const h = createHarness();
    const update = await node(readyState(), h.config);
    expect(seen).toHaveLength(1);
    expect(update.guide).toMatchObject({ slug: "acme", mode: "live" });
    expect(update.failure).toBeUndefined();
  });

  it("emits the stage events and marks stage 8 completed, as the real save stage does", async () => {
    const h = createHarness();
    const update = await captureSaveNode(() => {})(readyState(), h.config);
    expect(h.events.map((e) => e.type)).toEqual([
      "stage.started",
      "stage.done",
    ]);
    expect(update.completed).toEqual([8]);
  });

  it("still hands the state over, and fails the run as INTERNAL, when no claim is Sourced", async () => {
    const seen: unknown[] = [];
    const allUncertain = readyState().claims.map((claim) => ({
      ...claim,
      label: "uncertain" as const,
    }));
    const h = createHarness();
    const update = await captureSaveNode((state) => seen.push(state))(
      readyState({ claims: allUncertain }),
      h.config,
    );
    expect(seen).toHaveLength(1);
    expect(update.failure).toMatchObject({ stage: 8, code: "INTERNAL" });
    expect(error).toHaveBeenCalledWith("guide not saved", {
      runId: "run_1",
      reason: "no sourced claim",
    });
  });
});
