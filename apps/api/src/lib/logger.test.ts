/**
 * File: logger.test.ts
 * Purpose: Tests that the logger writes one JSON line per call to the right stream.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("writes info as one JSON line on stdout with fields", () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    logger.info("run started", { runId: "run_1" });
    const line = JSON.parse(String(write.mock.calls[0]?.[0]));
    expect(line).toMatchObject({
      level: "info",
      message: "run started",
      runId: "run_1",
    });
    expect(String(write.mock.calls[0]?.[0]).endsWith("\n")).toBe(true);
  });

  it("writes errors on stderr", () => {
    const write = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    logger.error("boom");
    expect(JSON.parse(String(write.mock.calls[0]?.[0])).level).toBe("error");
  });
});
