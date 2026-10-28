/**
 * File: app-error.ts
 * Purpose: Typed HTTP errors mapped to the API error contract in docs/api-design.md.
 * Exports: AppError and HTTP-specific subclasses
 * Used by: services, controllers, middleware, resolve-api-error.ts
 */
import type { ApiErrorCode } from "@stamp/schema";

const DEFAULT_VALIDATION_MESSAGE = "Check the request and try again.";
const DEFAULT_NOT_FOUND_MESSAGE = "We could not find that resource.";
const DEFAULT_RATE_LIMITED_MESSAGE = "Too many runs. Try again in a minute.";
const DEFAULT_RUN_CAP_MESSAGE =
  "Live generation is paused. Try a library guide.";
const DEFAULT_INTERNAL_MESSAGE = "Something went wrong.";

/** Base error with a client-safe code, message, and HTTP status. */
export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly retryAfterSeconds?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number,
    options?: { retryAfterSeconds?: number },
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

/** 400 — invalid request body, params, or query. */
export class ValidationError extends AppError {
  constructor(message: string = DEFAULT_VALIDATION_MESSAGE) {
    super("VALIDATION_ERROR", message, 400);
    this.name = "ValidationError";
  }
}

/** 404 — resource does not exist. */
export class NotFoundError extends AppError {
  constructor(message: string = DEFAULT_NOT_FOUND_MESSAGE) {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

/** 429 — too many requests from this client. */
export class RateLimitedError extends AppError {
  constructor(
    message: string = DEFAULT_RATE_LIMITED_MESSAGE,
    retryAfterSeconds?: number,
  ) {
    super("RATE_LIMITED", message, 429, { retryAfterSeconds });
    this.name = "RateLimitedError";
  }
}

/** 503 — daily live-run cap reached. */
export class RunCapReachedError extends AppError {
  constructor(message: string = DEFAULT_RUN_CAP_MESSAGE) {
    super("RUN_CAP_REACHED", message, 503);
    this.name = "RunCapReachedError";
  }
}

/** 500 — unexpected server failure. */
export class InternalError extends AppError {
  constructor(message: string = DEFAULT_INTERNAL_MESSAGE) {
    super("INTERNAL", message, 500);
    this.name = "InternalError";
  }
}
