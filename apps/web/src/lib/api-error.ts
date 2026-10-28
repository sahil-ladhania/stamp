/**
 * File: api-error.ts
 * Purpose: The one error type components and hooks see. Raw Axios errors never leave lib/.
 * Exports: ClientErrorCode, ApiErrorKind, ApiError, isApiError
 * Used by: lib/to-api-error.ts, lib/parse-response.ts, services/*, hooks/*, utils/error-messages.ts
 */
import type { ApiErrorCode } from '@stamp/schema'

/** Failures that happen in the browser, not in the API: no connection, or a reply that does not match the schema. */
export type ClientErrorCode = 'NETWORK' | 'INVALID_RESPONSE'

export type ApiErrorKind = ApiErrorCode | ClientErrorCode

type ApiErrorOptions = {
  status?: number
  /** Seconds, from the `Retry-After` header of a 429. */
  retryAfter?: number
  cause?: unknown
}

export class ApiError extends Error {
  readonly code: ApiErrorKind
  /** The HTTP status, or null when there was no response. */
  readonly status: number | null
  /** Seconds to wait before retrying, or null when the API gave none. */
  readonly retryAfter: number | null

  constructor(code: ApiErrorKind, message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.code = code
    this.status = options.status ?? null
    this.retryAfter = options.retryAfter ?? null
  }
}

/** Narrows an unknown caught value to ApiError. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}
