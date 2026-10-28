/**
 * File: save.test.ts
 * Purpose: Tests the save stage: the guide it stores, partial coverage, the INTERNAL cases and the verification log.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { fakeDb } from "../../test-support/fake-db.js";
import { createHarness, trace } from "../../test-support/graph-harness.js";
import { APP } from "../../test-support/node-fixtures.js";
import { readyState, savedGuide } from "../../test-support/save-helpers.js";
import { failureOf } from "../../test-support/extract-node-helpers.js";

vi.mock("../../lib/prisma.js", async () => ({
  prisma: (await import("../../test-support/fake-db.js")).fakeDb.prisma,
}));
const { saveNode } = await import("./save.js");

const info = vi.spyOn(logger, "info");
const warn = vi.spyOn(logger, "warn");
const error = vi.spyOn(logger, "error");

beforeEach(() => {
  fakeDb.reset();
  [info, warn, error].forEach((spy) =>
    spy.mockReset().mockImplementation(() => {}),
  );
});

async function save(over: Parameters<typeof readyState>[0] = {}) {
  const h = createHarness();
  const update = await saveNode(readyState(over), h.config);
  return { h, update };
}

describe("saveNode", () => {
  it("stores a valid live guide under the slug and returns it", async () => {
    const { update } = await save();
    const guide = savedGuide(update);
    expect(guide).toMatchObject({
      slug: "acme",
      mode: "live",
      coverage: "full",
    });
    expect(fakeDb.guides.get("acme")).toMatchObject({
      mode: "LIVE",
      appName: "Acme",
      domain: "acme.com",
    });
    expect(update.libraryProtected).toBeUndefined();
  });

  it("stamps the guide with the run's clock", async () => {
    const { h, update } = await save();
    expect(savedGuide(update).asOf).toBe(new Date(h.deps.now()).toISOString());
  });

  it("emits its stage events and marks stage 8 completed", async () => {
    const { h, update } = await save();
    expect(trace(h.events)).toEqual(["stage.started:8", "stage.done:8"]);
    expect(update.completed).toEqual([8]);
  });

  it("writes the checks to the verification log under the stored guide, with the run id", async () => {
    const { update } = await save();
    const state = readyState();
    expect(fakeDb.verificationLog.rows).toHaveLength(state.checks.length);
    expect(fakeDb.verificationLog.rows[0]).toMatchObject({
      guideId: "guide_acme",
      runId: "run_1",
      method: "QUOTE_MATCH",
      result: "PASS",
    });
    expect(
      JSON.parse(fakeDb.verificationLog.rows[0]?.detail ?? "{}"),
    ).toHaveProperty("contentHash");
    expect(update.failure).toBeUndefined();
  });

  it("makes a partial guide when a stage before save did not finish", async () => {
    const { update } = await save({ completed: [0, 1, 2, 3, 4, 5] });
    expect(savedGuide(update).coverage).toBe("partial");
  });

  it("makes a partial guide when a node flagged the run partial", async () => {
    expect(savedGuide((await save({ partial: true })).update).coverage).toBe(
      "partial",
    );
  });

  it("counts a Tested claim as Sourced for the INTERNAL rule", async () => {
    const base = readyState();
    const claims = base.claims.map((c) => ({
      ...c,
      label: c.label === "sourced" ? ("tested" as const) : c.label,
    }));
    expect(failureOf((await save({ claims })).update)).toBeUndefined();
  });

  it("fails as INTERNAL at stage 8 when no claim ended up Sourced, and stores nothing", async () => {
    const claims = readyState().claims.map((c) => ({
      ...c,
      label: "uncertain" as const,
      sources: [],
    }));
    const { h, update } = await save({ claims });
    expect(failureOf(update)).toMatchObject({ stage: 8, code: "INTERNAL" });
    expect(fakeDb.guides.size).toBe(0);
    expect(fakeDb.verificationLog.rows).toEqual([]);
    expect(trace(h.events)).toEqual(["stage.started:8"]);
  });

  it("fails as INTERNAL when the budget stopped the run before verify, so there are no claims", async () => {
    const { update } = await save({ claims: [], completed: [0, 1, 2, 3, 4] });
    expect(failureOf(update)).toMatchObject({ code: "INTERNAL" });
  });

  it.each([
    ["app", { app: null }],
    ["score", { difficulty: null }],
    ["archetype", { archetype: null }],
  ])("fails as INTERNAL when the %s is missing", async (_name, over) => {
    expect(failureOf((await save(over)).update)).toMatchObject({
      code: "INTERNAL",
    });
  });

  it("fails as INTERNAL when the assembled guide is invalid, logging only the path of the problem", async () => {
    const { update } = await save({ app: { ...APP, appName: "" } });
    expect(failureOf(update)).toMatchObject({ code: "INTERNAL" });
    expect(fakeDb.guides.size).toBe(0);
    expect(error.mock.calls).toEqual([
      [
        "guide not saved",
        { runId: "run_1", reason: "invalid guide at appName" },
      ],
    ]);
  });

  it("leaves a library guide alone, returns the guide and flags the run, writing no log", async () => {
    fakeDb.addGuide({ slug: "acme", mode: "LIBRARY" });
    const { update } = await save();
    expect(update.libraryProtected).toBe(true);
    expect(savedGuide(update).slug).toBe("acme");
    expect(fakeDb.guides.get("acme")).toMatchObject({ mode: "LIBRARY" });
    expect(fakeDb.prisma.guide.upsert).not.toHaveBeenCalled();
    expect(fakeDb.verificationLog.rows).toEqual([]);
  });

  it("still succeeds when the verification log cannot be written, and warns", async () => {
    fakeDb.verificationLog.delegate.createMany.mockRejectedValueOnce(
      new Error("db down"),
    );
    const { update } = await save();
    expect(failureOf(update)).toBeUndefined();
    expect(savedGuide(update).slug).toBe("acme");
    expect(warn).toHaveBeenCalledWith(
      "verification log not written",
      expect.objectContaining({ runId: "run_1" }),
    );
  });

  it("lets a database failure on the guide itself reach the runner", async () => {
    fakeDb.prisma.guide.upsert.mockRejectedValueOnce(new Error("db down"));
    await expect(save()).rejects.toThrow("db down");
  });
});
