/**
 * File: resolve-api-error.ts
 * Purpose: Maps thrown values to HTTP status, JSON body, and optional headers.
 * Exports: resolveApiError, ResolvedApiError
 * Used by: middleware/error-handler.ts, tests
 */
import type { ApiErrorBody } from "@stamp/schema";
import { ZodError } from "zod";
import {
  AppError,
  InternalError,
  ValidationError,
} from "./app-error.js";

export type ResolvedApiError = {
  statusCode: number;
  body: ApiErrorBody;
  headers?: Record<string, string>;
};

const BAD_JSON_MESSAGE = "Request body must be valid JSON.";

/** Converts any thrown value into a client-safe API error response. */
export function resolveApiError(err: unknown): ResolvedApiError {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message },
    };
    const headers =
      err.retryAfterSeconds !== undefined
        ? { "Retry-After": String(err.retryAfterSeconds) }
        : undefined;
    return { statusCode: err.statusCode, body, headers };
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const path = first?.path.length ? first.path.join(".") : undefined;
    const detail = first?.message;
    const message =
      path && detail
        ? `${path}: ${detail}`
        : detail ?? "Check the request and try again.";
    return resolveApiError(new ValidationError(message));
  }

  if (err instanceof SyntaxError) {
    return resolveApiError(new ValidationError(BAD_JSON_MESSAGE));
  }

  return resolveApiError(new InternalError());
};