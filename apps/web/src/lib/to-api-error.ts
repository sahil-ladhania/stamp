/**
 * File: to-api-error.ts
 * Purpose: Pure mapping from anything Axios throws to a typed ApiError (docs/api-design.md section 4).
 * Exports: parseRetryAfter, toApiError
 * Used by: lib/api-client.ts, hooks/useAsyncData.ts
 */
import { ApiErrorBodySchema } from '@stamp/schema'
import { isAxiosError, type AxiosResponse } from 'axios'
import { ApiError, isApiError, type ApiErrorKind } from './api-error'

const SERVER_ERROR_STATUS = 500

/** Header names are case-insensitive: browsers lowercase them, a test adapter may not. */
function readHeader(headers: AxiosResponse['headers'], name: string): unknown {
  return Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1]
}

/** `Retry-After` in whole seconds. The API sends seconds, never an HTTP date, so anything else is null. */
export function parseRetryAfter(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  if (typeof value === 'string' && value.trim() === '') return null
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null
}

/** The code for a reply that is not the API's own error body, such as a proxy's HTML 502 page. */
function codeFromStatus(status: number): ApiErrorKind {
  if (status >= SERVER_ERROR_STATUS) return 'NETWORK'
  if (status === 400) return 'VALIDATION_ERROR'
  if (status === 404) return 'NOT_FOUND'
  if (status === 429) return 'RATE_LIMITED'
  return 'INTERNAL'
}

function fromResponse(response: AxiosResponse, cause: unknown): ApiError {
  const body = ApiErrorBodySchema.safeParse(response.data)
  const code = body.success ? body.data.error.code : codeFromStatus(response.status)
  const message = body.success
    ? body.data.error.message
    : `The server replied ${response.status} without an API error body.`
  const retryAfter =
    code === 'RATE_LIMITED'
      ? parseRetryAfter(readHeader(response.headers, 'retry-after'))
      : null
  return new ApiError(code, message, {
    status: response.status,
    ...(retryAfter === null ? {} : { retryAfter }),
    cause,
  })
}

/** Network errors and timeouts carry no response, so they become NETWORK. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error
  if (!isAxiosError(error)) {
    return new ApiError('INTERNAL', 'An unexpected error occurred in the client.', {
      cause: error,
    })
  }
  if (!error.response) {
    return new ApiError('NETWORK', error.message, { cause: error })
  }
  return fromResponse(error.response, error)
}
