/**
 * File: error-text.ts
 * Purpose: One-line error text for logs: the error's name and message, never its cause or any upstream payload.
 * Exports: errorText
 * Used by: agent/run-real-agent.ts, agent/nodes/*
 */

/** "TypeError: bad input"; the cause chain is left out because it can carry request headers. */
export function errorText(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : "unknown error";
}
