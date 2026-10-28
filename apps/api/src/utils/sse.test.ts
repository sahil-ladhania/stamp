/**
 * File: sse.test.ts
 * Purpose: Tests the SSE wire format for events, heartbeats and headers.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { sendSseEvent, sendSseHeartbeat, startSse } from "./sse.js";

describe("sendSseEvent", () => {
  it("writes an event line, one data line and a blank line", () => {
    const write = vi.fn();
    sendSseEvent(
      { write },
      { type: "search.query", runId: "run_1", query: "notion oauth scopes" },
    );
    expect(write).toHaveBeenCalledTimes(1);
    const text = String(write.mock.calls[0]?.[0]);
    expect(text).toBe(
      'event: search.query\ndata: {"type":"search.query","runId":"run_1","query":"notion oauth scopes"}\n\n',
    );
  });
});

describe("sendSseHeartbeat", () => {
  it("writes a comment line", () => {
    const write = vi.fn();
    sendSseHeartbeat({ write });
    expect(write).toHaveBeenCalledWith(": heartbeat\n\n");
  });
});

describe("startSse", () => {
  it("sends event-stream headers and flushes them immediately", () => {
    const writeHead = vi.fn();
    const flushHeaders = vi.fn();
    startSse({ writeHead, flushHeaders });
    expect(writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      }),
    );
    expect(flushHeaders).toHaveBeenCalledTimes(1);
  });
});
