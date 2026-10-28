/**
 * File: run-agent.test.ts
 * Purpose: Tests that AGENT_MODE picks the stub or the real-mode placeholder.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RunAgentInput } from "./run-agent.js";

const config = vi.hoisted(() => ({ AGENT_MODE: "stub" as "stub" | "real" }));
vi.mock("../config.js", () => ({ getConfig: () => config }));
vi.mock("./stub/run-stub-agent.js", () => ({ runStubAgent: vi.fn() }));

const { runStubAgent } = await import("./stub/run-stub-agent.js");
const { runAgent } = await import("./run-agent.js");
const stub = vi.mocked(runStubAgent);

const input: RunAgentInput = {
  runId: "run_1",
  app: "Notion",
  slug: "notion",
  emit: async () => {},
  signal: new AbortController().signal,
};

beforeEach(() => {
  stub.mockReset();
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

  it("keeps the INTERNAL placeholder in real mode and never calls the stub", async () => {
    config.AGENT_MODE = "real";
    expect(await runAgent(input)).toEqual({
      ok: false,
      failure: {
        stage: 0,
        code: "INTERNAL",
        message: "The research agent is not available yet.",
      },
    });
    expect(stub).not.toHaveBeenCalled();
  });
});
