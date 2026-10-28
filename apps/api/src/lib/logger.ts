/**
 * File: logger.ts
 * Purpose: Structured JSON-line logger; one object per line, optional runId for correlation.
 * Exports: logger
 * Used by: lib/server.ts, lib/log-server-error.ts, services, agent
 */

type LogFields = Record<string, unknown>;

function write(
  stream: NodeJS.WriteStream,
  level: string,
  message: string,
  fields: LogFields,
): void {
  const line = { level, time: new Date().toISOString(), message, ...fields };
  stream.write(`${JSON.stringify(line)}\n`);
}

/** Never pass API keys, tokens or full page text in fields. */
export const logger = {
  info: (message: string, fields: LogFields = {}): void =>
    write(process.stdout, "info", message, fields),
  warn: (message: string, fields: LogFields = {}): void =>
    write(process.stderr, "warn", message, fields),
  error: (message: string, fields: LogFields = {}): void =>
    write(process.stderr, "error", message, fields),
};
