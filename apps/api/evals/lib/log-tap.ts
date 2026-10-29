/**
 * File: log-tap.ts
 * Purpose: Collects the agent's JSON log lines by run id while a batch runs, and keeps them off the console; other output passes through.
 * Exports: tapLogs, LogTap, TappableStream
 * Used by: evals/lib/run-one.ts, evals/lib/run-batch.ts
 */

export type TappableStream = {
  write: (chunk: string | Uint8Array, ...rest: never[]) => boolean;
};

export type LogTap = {
  /** The parsed log lines this run wrote, in order. */
  linesFor: (runId: string) => Record<string, unknown>[];
  /** Puts the streams back as they were. */
  stop: () => void;
};

function parseRunLine(
  line: string,
): { runId: string; fields: Record<string, unknown> } | null {
  try {
    const parsed: unknown = JSON.parse(line);
    if (typeof parsed !== "object" || parsed === null) return null;
    const fields = parsed as Record<string, unknown>;
    return typeof fields.runId === "string"
      ? { runId: fields.runId, fields }
      : null;
  } catch {
    return null;
  }
}

/**
 * Wraps `write` on each stream. A line that parses as JSON with a string runId is kept and not printed;
 * every other line is passed to the real `write` unchanged. The agent's logger writes one whole line per call.
 */
export function tapLogs(
  streams: TappableStream[] = [process.stdout, process.stderr],
): LogTap {
  const byRun = new Map<string, Record<string, unknown>[]>();
  const originals = streams.map((stream) => stream.write);

  streams.forEach((stream, index) => {
    const original = originals[index] as TappableStream["write"];
    stream.write = ((chunk: string | Uint8Array): boolean => {
      const passed: string[] = [];
      for (const line of String(chunk).split(/(?<=\n)/)) {
        const found = parseRunLine(line.trim());
        if (found) {
          byRun.set(found.runId, [
            ...(byRun.get(found.runId) ?? []),
            found.fields,
          ]);
        } else if (line !== "") {
          passed.push(line);
        }
      }
      return passed.length === 0
        ? true
        : original.call(stream, passed.join(""));
    }) as TappableStream["write"];
  });

  return {
    linesFor: (runId) => byRun.get(runId) ?? [],
    stop: () => {
      streams.forEach((stream, index) => {
        stream.write = originals[index] as TappableStream["write"];
      });
    },
  };
}
