/**
 * File: error-handler.ts
 * Purpose: Formats all errors as { error: { code, message } } per docs/api-design.md.
 * Exports: errorHandler
 * Used by: lib/server.ts
 */
import type { NextFunction, Request, Response } from "express";
import { AppError, InternalError } from "../errors/app-error.js";
import { resolveApiError } from "../errors/resolve-api-error.js";
import { logServerError } from "../lib/log-server-error.js";

/** Express error middleware; must be registered after all routes. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const shouldLog =
    !(err instanceof AppError) || err instanceof InternalError;
  if (shouldLog) {
    logServerError(err);
  }

  const resolved = resolveApiError(err);
  if (resolved.headers) {
    for (const [key, value] of Object.entries(resolved.headers)) {
      res.setHeader(key, value);
    }
  }
  res.status(resolved.statusCode).json(resolved.body);
}
