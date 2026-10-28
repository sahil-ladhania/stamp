/**
 * File: sse.ts
 * Purpose: Server-sent events helpers: open the stream, write one event, write a heartbeat.
 * Exports: SSE_HEARTBEAT_MS, startSse, sendSseEvent, sendSseHeartbeat
 * Used by: controllers/runs.ts
 */
import type { RunStreamEvent } from "@stamp/schema";

export const SSE_HEARTBEAT_MS = 15_000;

type SseHeaderTarget = {
  writeHead(status: number, headers: Record<string, string>): unknown;
  flushHeaders(): void;
};
type SseWritable = { write(chunk: string): unknown };

/** Sends the SSE headers and flushes them at once, so the client sees the stream open. */
export function startSse(res: SseHeaderTarget): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Stops nginx-style proxies from buffering the stream.
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
}

/** Writes one event; the payload is the full event JSON, `type` included. */
export function sendSseEvent(out: SseWritable, event: RunStreamEvent): void {
  out.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

/** Writes a comment line that keeps idle connections open through proxies. */
export function sendSseHeartbeat(out: SseWritable): void {
  out.write(": heartbeat\n\n");
}
