/**
 * File: resolve-api-error.ts
 * Purpose: Maps thrown values to HTTP status, JSON body, and optional headers.
 * Exports: resolveApiError, ResolvedApiError
 * Used by: middleware/error-handler.ts, tests
 */
import type { ApiErrorBody } from "@stamp/schema";
import { AppError, InternalError, ValidationError } from "./app-error.js";

export type ResolvedApiError = {
  statusCode: number;
  body: ApiErrorBody;
  headers?: Record<string, string>;
};

const BAD_JSON_MESSAGE = "Request body must be valid JSON.";
const BODY_TOO_LARGE_MESSAGE = "Request body is too large.";

/** body-parser tags an oversized body with type "entity.too.large". */
function isBodyTooLarge(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    err.type === "entity.too.large"
  );
}

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

  if (isBodyTooLarge(err)) {
    return resolveApiError(new ValidationError(BODY_TOO_LARGE_MESSAGE));
  }

  if (err instanceof SyntaxError) {
    return resolveApiError(new ValidationError(BAD_JSON_MESSAGE));
  }

  // A ZodError is not special-cased: request input is checked by the validate
  // middleware, so one reaching this point is a server-side parse failure (500).
  return resolveApiError(new InternalError());
}
