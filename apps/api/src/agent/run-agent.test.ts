/**
 * File: run-agent.test.ts
 * Purpose: Tests that AGENT_MODE picks the scripted stub or the real LangGraph agent, and that stub mode never loads the real one.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RunAgentInput } from "./run-agent.js";

const config = vi.hoisted(() => ({ AGENT_MODE: "stub" as "stub" | "real" }));
vi.mock("../config.js", () => ({ getConfig: () => config }));
vi.mock("./stub/run-stub-agent.js", () => ({ runStubAgent: vi.fn() }));
const loaded = vi.hoisted(() => ({ real: 0 }));
vi.mock("./run-real-agent.js", () => {
  loaded.real += 1;
  return { runRealAgent: vi.fn() };
});

const { runStubAgent } = await import("./stub/run-stub-agent.js");
const { runAgent } = await import("./run-agent.js");
const stub = vi.mocked(runStubAgent);
const { runRealAgent } = await import("./run-real-agent.js");
const real = vi.mocked(runRealAgent);

const input: RunAgentInput = {
  runId: "run_1",
  app: "Notion",
  slug: "notion",
  emit: async () => {},
  signal: new AbortController().signal,
};

beforeEach(() => {
  stub.mockReset();
  real.mockReset();
  config.AGENT_MODE = "stub";
});

describe("runAgent", () => {
  it("hands the same input to the stub agent in stub mode", async () => {
    const outcome = {
      ok: true as const,
      slug: "notion",
      status: "done" as const,
    };
    stub.mockResolvedValue(outcome);
    expect(await runAgent(input)).toBe(outcome);
    expect(stub).toHaveBeenCalledWith(input);
  });

  it("hands the same input to the real agent in real mode and never calls the stub", async () => {
    config.AGENT_MODE = "real";
    const outcome = {
      ok: true as const,
      slug: "notion",
      status: "partial" as const,
    };
    real.mockResolvedValue(outcome);
    expect(await runAgent(input)).toBe(outcome);
    expect(real).toHaveBeenCalledExactlyOnceWith(input);
    expect(stub).not.toHaveBeenCalled();
  });

  it("passes the real agent's failure through unchanged", async () => {
    config.AGENT_MODE = "real";
    const failure = {
      ok: false as const,
      failure: { stage: 0, code: "NO_PUBLIC_DOCS" as const, message: "none" },
    };
    real.mockResolvedValue(failure);
    expect(await runAgent(input)).toBe(failure);
  });

  // Last on purpose: it re-registers the mock and resets modules for the tests after it.
  it("does not load the real agent in stub mode", async () => {
    loaded.real = 0;
    vi.resetModules();
    vi.doMock("./run-real-agent.js", () => {
      loaded.real += 1;
      return { runRealAgent: vi.fn() };
    });
    const fresh = await import("./run-agent.js");
    await fresh.runAgent(input);
    expect(loaded.real).toBe(0);
  });
});
