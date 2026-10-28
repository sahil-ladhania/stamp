/**
 * File: search-message.test.ts
 * Purpose: Tests the line under a search box: looking up, each failure, and the run cap that has its own notice.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api-error'
import { getSearchMessage } from './search-message'

const idle = { isPending: false, app: 'HubSpot', error: null }

describe('getSearchMessage', () => {
  it('names the app while the run starts', () => {
    expect(getSearchMessage({ ...idle, isPending: true })).toBe('Looking up HubSpot')
  })

  it('says nothing when idle', () => {
    expect(getSearchMessage(idle)).toBeNull()
  })

  it('gives the wait on a rate limit', () => {
    const error = new ApiError('RATE_LIMITED', 'Too many.', { status: 429, retryAfter: 42 })
    expect(getSearchMessage({ ...idle, error })).toContain('42 seconds')
  })

  it('gives the network copy when the server cannot be reached', () => {
    const error = new ApiError('NETWORK', 'Network Error')
    expect(getSearchMessage({ ...idle, error })).toContain('could not reach the server')
  })

  it('adds no line for the run cap, which the paused notice covers', () => {
    const error = new ApiError('RUN_CAP_REACHED', 'Paused.', { status: 503 })
    expect(getSearchMessage({ ...idle, error })).toBeNull()
  })

  it('prefers the pending line over an older error', () => {
    const error = new ApiError('NETWORK', 'x')
    expect(getSearchMessage({ isPending: true, app: 'Notion', error })).toBe('Looking up Notion')
  })
})
