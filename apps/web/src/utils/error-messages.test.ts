/**
 * File: error-messages.test.ts
 * Purpose: Tests the error copy: every code has a message, the retry wait reads well, and the copy rules hold.
 * Exports: none
 * Used by: vitest
 */
import { ApiErrorCodeSchema, RunErrorCodeSchema } from '@stamp/schema'
import { describe, expect, it } from 'vitest'
import type { ApiErrorKind } from '@/lib/api-error'
import { formatRetryWait, getApiErrorMessage, RUN_ERROR_COPY } from './error-messages'

const API_CODES: ApiErrorKind[] = [...ApiErrorCodeSchema.options, 'NETWORK', 'INVALID_RESPONSE']

function allMessages(): string[] {
  return [
    ...API_CODES.map((code) => getApiErrorMessage({ code, retryAfter: 42 })),
    ...RunErrorCodeSchema.options.map((code) => RUN_ERROR_COPY[code]),
  ]
}

describe('getApiErrorMessage', () => {
  it.each(API_CODES)('has a message for %s', (code) => {
    expect(getApiErrorMessage({ code, retryAfter: null }).length).toBeGreaterThan(10)
  })

  it('names the wait the API asked for on a rate limit', () => {
    expect(getApiErrorMessage({ code: 'RATE_LIMITED', retryAfter: 42 })).toBe(
      'You have made too many requests. Try again in 42 seconds.',
    )
  })

  it('says "a minute" when the API gave no wait', () => {
    expect(getApiErrorMessage({ code: 'RATE_LIMITED', retryAfter: null })).toContain('in a minute.')
  })

  it('does not mention a wait on other errors', () => {
    expect(getApiErrorMessage({ code: 'NETWORK', retryAfter: 42 })).not.toContain('42')
  })
})

describe('RUN_ERROR_COPY', () => {
  it.each(RunErrorCodeSchema.options)('has copy for %s', (code) => {
    expect(RUN_ERROR_COPY[code].length).toBeGreaterThan(10)
  })
})

describe('formatRetryWait', () => {
  it.each([
    [null, 'a minute'],
    [0, 'a minute'],
    [1, '1 second'],
    [42, '42 seconds'],
    [59.2, '1 minute'],
    [60, '1 minute'],
    [61, '2 minutes'],
    [180, '3 minutes'],
  ])('writes %j seconds as "%s"', (seconds, text) => {
    expect(formatRetryWait(seconds)).toBe(text)
  })
})

describe('copy rules', () => {
  it('uses sentence case and ends every message with a full stop', () => {
    for (const message of allMessages()) {
      expect(message).toMatch(/^[A-Z]/)
      expect(message).toMatch(/\.$/)
    }
  })

  it('has no em dash, no "please" and no "successfully"', () => {
    for (const message of allMessages()) {
      expect(message).not.toMatch(/—|–/)
      expect(message).not.toMatch(/please|successfully/i)
    }
  })
})
