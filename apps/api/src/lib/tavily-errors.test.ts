/**
 * File: tavily-errors.test.ts
 * Purpose: Tests searchWeb call counting, logging, safe errors, timeout and abort.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  axiosLikeError,
  fakeTavily,
  neverResolves,
} from "../test-support/fake-tavily.js";
import { TimeoutError } from "../utils/with-timeout.js";
import { createRunUsage } from "./usage.js";

vi.mock("@tavily/core", async () => {
  const { fakeTavily } = await import("../test-support/fake-tavily.js");
  return {
    tavily: () => {
      return fakeTavily;
    },
  };
});
vi.mock("../config.js", async (importOriginal) => {
  const { realAgentConfig } = await import("../test-support/real-config.js");
  return {
    ...(await importOriginal<typeof import("../config.js")>()),
    getConfig: () => realAgentConfig,
  };
});

const { searchWeb } = await import("./tavily.js");
const { TavilyCallError } = await import("./tavily-client.js");

let logged: string[];

beforeEach(() => {
  fakeTavily.reset();
  logged = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    logged.push(String(chunk));
    return true;
  });
});
afterEach(() => vi.restoreAllMocks());

describe("searchWeb counters and logs", () => {
  it("counts each call with its credits", async () => {
    const usage = createRunUsage();
    fakeTavily.search.mockResolvedValue({ results: [], usage: { credits: 2 } });
    await searchWeb("a", { timeoutMs: 1000, usage });
    await searchWeb("b", { timeoutMs: 1000, usage });
    expect(usage.tavily).toEqual({
      searchCalls: 2,
      extractCalls: 0,
      credits: 4,
    });
  });

  it("counts a failed call too, since it may still be billed", async () => {
    const usage = createRunUsage();
    fakeTavily.search.mockRejectedValue(axiosLikeError(500));
    await searchWeb("a", { timeoutMs: 1000, usage }).catch(() => undefined);
    expect(usage.tavily).toEqual({
      searchCalls: 1,
      extractCalls: 0,
      credits: 0,
    });
  });

  it("logs one line with the run id and outcome but never the query", async () => {
    fakeTavily.search.mockResolvedValue({ results: [], usage: { credits: 1 } });
    await searchWeb("my secret query", { timeoutMs: 1000, runId: "run_3" });
    const line = logged.find((entry) => entry.includes('"tavily call"')) ?? "";
    expect(JSON.parse(line)).toMatchObject({
      runId: "run_3",
      kind: "search",
      ok: true,
      credits: 1,
    });
    expect(line).not.toContain("my secret query");
  });
});

describe("searchWeb failures", () => {
  it("wraps an HTTP error with only its status, never the key, and attaches no cause", async () => {
    fakeTavily.search.mockRejectedValue(axiosLikeError(429));
    const error = await searchWeb("q", { timeoutMs: 1000 }).catch(
      (err: unknown) => err,
    );
    expect(error).toBeInstanceOf(TavilyCallError);
    expect(error).toMatchObject({
      status: 429,
      message: "Tavily search failed (status 429)",
    });
    expect((error as Error).cause).toBeUndefined();
    expect(JSON.stringify(error)).not.toContain("tvly-secret-key");
    expect(String((error as Error).stack)).not.toContain("tvly-secret-key");
  });

  it("treats a response of the wrong shape as a failed call", async () => {
    fakeTavily.search.mockResolvedValue({ results: "nope" });
    await expect(searchWeb("q", { timeoutMs: 1000 })).rejects.toMatchObject({
      name: "TavilyCallError",
      status: undefined,
    });
  });

  it("throws a TimeoutError when the request hangs past the deadline", async () => {
    fakeTavily.search.mockReturnValue(neverResolves());
    await expect(searchWeb("q", { timeoutMs: 30 })).rejects.toBeInstanceOf(
      TimeoutError,
    );
  });

  it("stops waiting and rethrows the abort reason when the run is aborted", async () => {
    fakeTavily.search.mockReturnValue(neverResolves());
    const controller = new AbortController();
    const reason = new Error("run over");
    const pending = searchWeb("q", {
      timeoutMs: 5000,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(reason), 10);
    await expect(pending).rejects.toBe(reason);
  });

  it("does not call Tavily or count anything for an already aborted run", async () => {
    const usage = createRunUsage();
    const controller = new AbortController();
    controller.abort();
    await expect(
      searchWeb("q", { timeoutMs: 1000, usage, signal: controller.signal }),
    ).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fakeTavily.search).not.toHaveBeenCalled();
    expect(usage.tavily.searchCalls).toBe(0);
  });
});
