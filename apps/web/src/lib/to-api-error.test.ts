/**
 * File: to-api-error.test.ts
 * Purpose: Tests the mapping from Axios failures to ApiError: every API error code, Retry-After on a 429,
 *          network errors, timeouts and replies that are not the API's own error body.
 * Exports: none
 * Used by: vitest
 */
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, isApiError } from './api-error'
import { parseRetryAfter, toApiError } from './to-api-error'

function failure(status: number, data: unknown, headers: Record<string, string> = {}): AxiosError {
  const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() }
  const response: AxiosResponse = { status, statusText: '', data, headers, config }
  return new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response)
}

function apiBody(code: string, message: string): unknown {
  return { error: { code, message } }
}

describe('toApiError with an API error body', () => {
  it.each([
    [400, 'VALIDATION_ERROR'],
    [404, 'NOT_FOUND'],
    [429, 'RATE_LIMITED'],
    [503, 'RUN_CAP_REACHED'],
    [500, 'INTERNAL'],
  ])('maps status %i to %s and keeps the server message', (status, code) => {
    const error = toApiError(failure(status, apiBody(code, 'Server text.')))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe(code)
    expect(error.message).toBe('Server text.')
    expect(error.status).toBe(status)
  })

  it('keeps RUN_CAP_REACHED as itself, not as a network failure, although it is a 503', () => {
    expect(toApiError(failure(503, apiBody('RUN_CAP_REACHED', 'Paused.'))).code).toBe('RUN_CAP_REACHED')
  })
})

describe('Retry-After on a 429', () => {
  const rateLimited = apiBody('RATE_LIMITED', 'Too many runs.')

  it('reads the wait in seconds', () => {
    expect(toApiError(failure(429, rateLimited, { 'retry-after': '42' })).retryAfter).toBe(42)
  })

  it('reads the header whatever its case', () => {
    expect(toApiError(failure(429, rateLimited, { 'Retry-After': '7' })).retryAfter).toBe(7)
  })

  it('is null when the header is missing', () => {
    expect(toApiError(failure(429, rateLimited)).retryAfter).toBeNull()
  })

  it('is null when the header is not a number', () => {
    expect(toApiError(failure(429, rateLimited, { 'retry-after': 'soon' })).retryAfter).toBeNull()
  })

  it('is null on errors that are not rate limits', () => {
    expect(toApiError(failure(404, apiBody('NOT_FOUND', 'x'), { 'retry-after': '5' })).retryAfter).toBeNull()
  })
})

describe('toApiError without a usable body', () => {
  it('maps a request with no response to NETWORK', () => {
    const error = toApiError(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
    expect(error.code).toBe('NETWORK')
    expect(error.status).toBeNull()
  })

  it('maps a timeout to NETWORK', () => {
    const error = toApiError(new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED))
    expect(error.code).toBe('NETWORK')
  })

  it('maps a proxy HTML 502 page to NETWORK', () => {
    const error = toApiError(failure(502, '<html>Bad gateway</html>'))
    expect(error.code).toBe('NETWORK')
    expect(error.status).toBe(502)
  })

  it('maps a 500 without an API body (the dev proxy, API down) to NETWORK', () => {
    expect(toApiError(failure(500, '')).code).toBe('NETWORK')
  })

  it('still maps a bare 429 to RATE_LIMITED and reads its header', () => {
    const error = toApiError(failure(429, 'Too Many Requests', { 'retry-after': '30' }))
    expect(error.code).toBe('RATE_LIMITED')
    expect(error.retryAfter).toBe(30)
  })

  it('maps a bare 404 to NOT_FOUND', () => {
    expect(toApiError(failure(404, 'Not Found')).code).toBe('NOT_FOUND')
  })

  it('maps an unknown error code in the body to the status instead of trusting it', () => {
    expect(toApiError(failure(404, apiBody('SOMETHING_NEW', 'x'))).code).toBe('NOT_FOUND')
  })

  it('maps any other status to INTERNAL', () => {
    expect(toApiError(failure(418, 'teapot')).code).toBe('INTERNAL')
  })
})

describe('toApiError with other values', () => {
  it('returns an ApiError unchanged', () => {
    const original = new ApiError('NOT_FOUND', 'Missing.')
    expect(toApiError(original)).toBe(original)
  })

  it('wraps an error that is not from Axios as INTERNAL', () => {
    const error = toApiError(new TypeError('boom'))
    expect(error.code).toBe('INTERNAL')
    expect(isApiError(error)).toBe(true)
  })
})

describe('parseRetryAfter', () => {
  it.each([
    ['42', 42],
    [42, 42],
    ['1.2', 2],
    ['0', 0],
  ])('reads %j as %j seconds', (value, seconds) => {
    expect(parseRetryAfter(value)).toBe(seconds)
  })

  it.each([[''], ['  '], ['-3'], ['Wed, 21 Oct 2026 07:28:00 GMT'], [undefined], [null], [{}]])(
    'reads %j as no wait',
    (value) => {
      expect(parseRetryAfter(value)).toBeNull()
    },
  )
})
