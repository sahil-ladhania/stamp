/**
 * File: run-phase.test.ts
 * Purpose: Tests the run phase: each state the page can be in, and that a terminal event beats a later stream failure.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { getRunPhase } from './run-phase'
import type { RunOutcome } from './run-view'

const running: RunOutcome = { kind: 'running' }
const base = { outcome: running, error: null, connection: 'open' as const, hasEvents: true }

describe('getRunPhase', () => {
  it('is connecting until the first event arrives', () => {
    expect(getRunPhase({ ...base, connection: 'connecting', hasEvents: false })).toBe('connecting')
  })

  it('is running once events flow, and while reconnecting', () => {
    expect(getRunPhase(base)).toBe('running')
    expect(getRunPhase({ ...base, connection: 'reconnecting' })).toBe('running')
    expect(getRunPhase({ ...base, connection: 'connecting', hasEvents: true })).toBe('running')
  })

  it('reads done and partial from the outcome', () => {
    expect(getRunPhase({ ...base, outcome: { kind: 'done', slug: 's', status: 'done' } })).toBe('done')
    expect(getRunPhase({ ...base, outcome: { kind: 'done', slug: 's', status: 'partial' } })).toBe('partial')
  })

  it('is stopped after a run error', () => {
    const outcome: RunOutcome = { kind: 'error', stage: 3, code: 'INTERNAL', message: 'x', options: [] }
    expect(getRunPhase({ ...base, outcome })).toBe('stopped')
  })

  it('is not found for an unknown run, and disconnected for any other stream failure', () => {
    expect(getRunPhase({ ...base, error: { code: 'NOT_FOUND' }, hasEvents: false })).toBe('not-found')
    expect(getRunPhase({ ...base, error: { code: 'NETWORK' } })).toBe('disconnected')
  })

  it('lets a terminal event win over a stream failure that follows it', () => {
    const outcome: RunOutcome = { kind: 'done', slug: 's', status: 'done' }
    expect(getRunPhase({ ...base, outcome, error: { code: 'NETWORK' } })).toBe('done')
  })
})
