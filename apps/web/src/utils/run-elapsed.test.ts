/**
 * File: run-elapsed.test.ts
 * Purpose: Tests the elapsed time of a run: live, finished, and a browser clock that is behind the server.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { computeElapsedMs } from './run-elapsed'

const startedAt = '2026-10-28T10:00:00.000Z'
const start = Date.parse(startedAt)

describe('computeElapsedMs', () => {
  it('counts to now while the run is live', () => {
    expect(computeElapsedMs({ startedAt, finishedAt: null, now: start + 12_500 })).toBe(12_500)
  })

  it('uses the finish time once the run has ended, whatever the clock says', () => {
    const finishedAt = '2026-10-28T10:01:05.000Z'
    expect(computeElapsedMs({ startedAt, finishedAt, now: start + 999_999 })).toBe(65_000)
  })

  it('is never negative when the browser clock is behind', () => {
    expect(computeElapsedMs({ startedAt, finishedAt: null, now: start - 3000 })).toBe(0)
  })

  it('is zero when a date cannot be read', () => {
    expect(computeElapsedMs({ startedAt: 'soon', finishedAt: null, now: start })).toBe(0)
    expect(computeElapsedMs({ startedAt, finishedAt: 'later', now: start })).toBe(0)
  })
})
