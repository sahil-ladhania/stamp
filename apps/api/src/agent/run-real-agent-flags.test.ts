/**
 * File: run-real-agent-flags.test.ts
 * Purpose: Tests the runner's per-run switches: the probe kill switch from config (and its override), and a library-protected save reported as done.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDeps } from "./deps.js";
import { stageNode } from "./stage-node.js";
import type { RunAgentInput } from "./run-agent.js";
import { buildStubGuide } from "./stub/stub-guide.js";

const config = vi.hoisted(() => ({
  AGENT_RUN_BUDGET_MS: 120_000,
  AGENT_EXTRACT_CONCURRENCY: 5,
  AGENT_PROBE: "on",
}));
vi.mock("../config.js", () => ({ getConfig: () => config }));
vi.mock("./nodes/index.js", async () => ({
  defaultNodes: (await import("../test-support/graph-harness.js")).NOOP_NODES,
}));
const { runRealAgent } = await import("./run-real-agent.js");

const guide = buildStubGuide({
  slug: "notion",
  partial: false,
  asOf: new Date("2026-03-05T10:00:00.000Z"),
});
const input = (): RunAgentInput => ({
  runId: "run_1",
  app: "Notion",
  slug: "notion",
  emit: () => Promise.resolve(),
  signal: new AbortController().signal,
});

/** Records what the probe stage sees in its deps. */
function spyOnProbe() {
  const seen: boolean[] = [];
  const probe = stageNode("probe", (_state, runnable) => {
    seen.push(getDeps(runnable).probeEnabled);
    return Promise.resolve({});
  });
  return { seen, probe };
}

beforeEach(() => {
  config.AGENT_PROBE = "on";
});

describe("the probe switch", () => {
  it("is on when AGENT_PROBE is on", async () => {
    const { seen, probe } = spyOnProbe();
    await runRealAgent(input(), {
      nodes: {
        probe,
        save: stageNode("save", () => Promise.resolve({ guide })),
      },
    });
    expect(seen).toEqual([true]);
  });

  it("is off when AGENT_PROBE is off", async () => {
    config.AGENT_PROBE = "off";
    const { seen, probe } = spyOnProbe();
    await runRealAgent(input(), {
      nodes: {
        probe,
        save: stageNode("save", () => Promise.resolve({ guide })),
      },
    });
    expect(seen).toEqual([false]);
  });

  it("can be overridden for one run", async () => {
    config.AGENT_PROBE = "off";
    const { seen, probe } = spyOnProbe();
    await runRealAgent(input(), {
      probeEnabled: true,
      nodes: {
        probe,
        save: stageNode("save", () => Promise.resolve({ guide })),
      },
    });
    expect(seen).toEqual([true]);
  });
});

describe("a library-protected save", () => {
  const partialExtract = stageNode("extract", () =>
    Promise.resolve({ partial: true }),
  );

  it("is reported as done, not partial, even when the run was partial", async () => {
    const save = stageNode("save", () =>
      Promise.resolve({ guide, libraryProtected: true }),
    );
    expect(
      await runRealAgent(input(), { nodes: { extract: partialExtract, save } }),
    ).toEqual({ ok: true, slug: "notion", status: "done" });
  });

  it("is reported as partial when the run was partial and no library guide owns the slug", async () => {
    const save = stageNode("save", () => Promise.resolve({ guide }));
    expect(
      await runRealAgent(input(), { nodes: { extract: partialExtract, save } }),
    ).toMatchObject({ status: "partial" });
  });
});
