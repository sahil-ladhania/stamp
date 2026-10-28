/**
 * File: log-server-error.ts
 * Purpose: Logs server-side error details to stderr without leaking secrets to clients.
 * Exports: logServerError
 * Used by: middleware/error-handler.ts
 */
import { logger } from "./logger.js";

/** Writes a structured error line for operators; never include API keys or tokens. */
export function logServerError(err: unknown): void {
  if (err instanceof Error) {
    logger.error("unhandled error", {
      name: err.name,
      detail: err.message,
      stack: err.stack,
    });
    return;
  }
  logger.error("unhandled error", { detail: String(err) });
}
