/**
 * File: tavily-extract-errors.test.ts
 * Purpose: Tests extractPages call counting, safe errors, timeout and abort.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const { extractPages } = await import("./tavily.js");

const page = (url: string, rawContent: string) => ({
  url,
  title: "Title",
  rawContent,
});

beforeEach(() => fakeTavily.reset());

describe("extractPages counters and failures", () => {
  it("counts the call with its credits", async () => {
    const usage = createRunUsage();
    fakeTavily.extract.mockResolvedValue({
      results: [page("https://example.com/a", "text")],
      usage: { credits: 2 },
    });
    await extractPages(["https://example.com/a"], { timeoutMs: 1000, usage });
    expect(usage.tavily).toEqual({
      searchCalls: 0,
      extractCalls: 1,
      credits: 2,
    });
  });

  it("wraps an HTTP error with only its status and no key", async () => {
    fakeTavily.extract.mockRejectedValue(axiosLikeError(401));
    const error = await extractPages(["https://example.com/a"], {
      timeoutMs: 1000,
    }).catch((err: unknown) => err);
    expect(error).toMatchObject({
      name: "TavilyCallError",
      status: 401,
      message: "Tavily extract failed (status 401)",
    });
    expect(JSON.stringify(error)).not.toContain("tvly-secret-key");
  });

  it("treats a response of the wrong shape as a failed call", async () => {
    fakeTavily.extract.mockResolvedValue({ results: [{ nope: true }] });
    await expect(
      extractPages(["https://example.com/a"], { timeoutMs: 1000 }),
    ).rejects.toMatchObject({
      name: "TavilyCallError",
    });
  });

  it("throws a TimeoutError on a hung request and stops on abort", async () => {
    fakeTavily.extract.mockReturnValue(neverResolves());
    await expect(
      extractPages(["https://example.com/a"], { timeoutMs: 30 }),
    ).rejects.toBeInstanceOf(TimeoutError);
    const controller = new AbortController();
    const pending = extractPages(["https://example.com/a"], {
      timeoutMs: 5000,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(new Error("run over")), 10);
    await expect(pending).rejects.toThrow("run over");
  });
});
