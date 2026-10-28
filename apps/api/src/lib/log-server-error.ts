/**
 * File: log-server-error.ts
 * Purpose: Logs server-side error details to stderr without leaking secrets to clients.
 * Exports: logServerError
 * Used by: middleware/error-handler.ts
 */

/** Writes a structured error line for operators; never include API keys or tokens. */
export function logServerError(err: unknown): void {
  if (err instanceof Error) {
    const payload = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
    process.stderr.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  process.stderr.write(`${JSON.stringify({ value: String(err) })}\n`);
}
