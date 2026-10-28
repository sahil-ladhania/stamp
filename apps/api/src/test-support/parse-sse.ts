/**
 * File: parse-sse.ts
 * Purpose: Test helper that splits an SSE response body into events and comments.
 * Exports: parseSse, SseMessage
 * Used by: app-runs.test.ts
 */

export type SseMessage = { event: string; data: unknown };

/** Parses `event:`/`data:` blocks; comment-only blocks (heartbeats) are returned separately. */
export function parseSse(text: string): {
  messages: SseMessage[];
  comments: string[];
} {
  const messages: SseMessage[] = [];
  const comments: string[] = [];
  for (const block of text.split("\n\n").filter(Boolean)) {
    const lines = block.split("\n");
    const event = lines.find((line) => line.startsWith("event: "));
    const data = lines.find((line) => line.startsWith("data: "));
    if (event && data) {
      messages.push({ event: event.slice(7), data: JSON.parse(data.slice(6)) });
    } else {
      comments.push(...lines.filter((line) => line.startsWith(":")));
    }
  }
  return { messages, comments };
}
