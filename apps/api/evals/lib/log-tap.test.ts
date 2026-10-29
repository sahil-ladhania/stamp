/**
 * File: log-tap.test.ts
 * Purpose: Tests collecting a run's JSON log lines by run id while letting other output through, and restoring the streams.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { tapLogs } from "./log-tap.js";

function fakeStream() {
  const written: string[] = [];
  const stream = {
    write: (chunk: string | Uint8Array): boolean => {
      written.push(String(chunk));
      return true;
    },
  };
  return { stream, written, original: stream.write };
}

const line = (fields: Record<string, unknown>) => `${JSON.stringify(fields)}\n`;

describe("tapLogs", () => {
  it("keeps a run's log lines and does not print them", () => {
    const out = fakeStream();
    const tap = tapLogs([out.stream]);
    out.stream.write(
      line({ message: "pages loaded", runId: "r1", fetched: 3 }),
    );
    out.stream.write(line({ message: "search summary", runId: "r2" }));
    tap.stop();
    expect(tap.linesFor("r1")).toEqual([
      { message: "pages loaded", runId: "r1", fetched: 3 },
    ]);
    expect(tap.linesFor("r2")).toHaveLength(1);
    expect(out.written).toEqual([]);
  });

  it("lets lines with no run id and plain text through", () => {
    const out = fakeStream();
    const tap = tapLogs([out.stream]);
    out.stream.write(line({ message: "server started" }));
    out.stream.write("plain text\n");
    tap.stop();
    expect(out.written).toEqual([
      line({ message: "server started" }),
      "plain text\n",
    ]);
  });

  it("splits a chunk that holds several lines", () => {
    const out = fakeStream();
    const tap = tapLogs([out.stream]);
    out.stream.write(
      line({ message: "a", runId: "r1" }) + line({ message: "b" }),
    );
    tap.stop();
    expect(tap.linesFor("r1")).toHaveLength(1);
    expect(out.written).toEqual([line({ message: "b" })]);
  });

  it("returns an empty list for a run it never saw", () => {
    const out = fakeStream();
    const tap = tapLogs([out.stream]);
    tap.stop();
    expect(tap.linesFor("nobody")).toEqual([]);
  });

  it("restores the original write on stop", () => {
    const out = fakeStream();
    const tap = tapLogs([out.stream]);
    expect(out.stream.write).not.toBe(out.original);
    tap.stop();
    expect(out.stream.write).toBe(out.original);
    out.stream.write(line({ message: "after", runId: "r1" }));
    expect(out.written).toHaveLength(1);
  });
});
