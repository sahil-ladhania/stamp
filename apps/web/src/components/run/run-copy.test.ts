/**
 * File: run-copy.test.ts
 * Purpose: Tests the Live run wording: the stage line for each phase, the tab title, the result card copy and the result actions.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { getResultActions, getResultCopy, getRunTitle, getStageLine } from './run-copy'

describe('getStageLine', () => {
  it('names the running stage in plain words', () => {
    expect(getStageLine({ phase: 'running', stage: 3 })).toBe('Reading pages')
    expect(getStageLine({ phase: 'running', stage: 5 })).toBe('Checking quotes')
  })

  it('says it is working between stages, and connecting before the first event', () => {
    expect(getStageLine({ phase: 'running', stage: null })).toBe('Working')
    expect(getStageLine({ phase: 'connecting', stage: null })).toBe('Connecting to the run')
  })

  it('says where a run stopped', () => {
    expect(getStageLine({ phase: 'stopped', stage: 4 })).toBe('Stopped while drafting claims')
    expect(getStageLine({ phase: 'stopped', stage: null })).toBe('Stopped')
  })

  it('says the outcome once the run ends', () => {
    expect(getStageLine({ phase: 'done', stage: null })).toBe('Guide ready')
    expect(getStageLine({ phase: 'partial', stage: null })).toBe('Time ran out. Guide saved')
    expect(getStageLine({ phase: 'disconnected', stage: null })).toBe('Lost the connection')
    expect(getStageLine({ phase: 'not-found', stage: null })).toBe('No run at this address')
  })
})

describe('getRunTitle', () => {
  it('names the app while researching, and says "this app" before the name is known', () => {
    expect(getRunTitle('running', 'Microsoft', null)).toBe('Researching Microsoft')
    expect(getRunTitle('connecting', null, null)).toBe('Researching this app')
  })

  it('says the guide is ready or partial', () => {
    expect(getRunTitle('done', 'Microsoft', null)).toBe('Microsoft guide is ready')
    expect(getRunTitle('partial', 'Microsoft', null)).toBe('Microsoft guide is partial')
    expect(getRunTitle('done', null, null)).toBe('The guide is ready')
  })

  it('uses the notice heading when the run did not finish', () => {
    expect(getRunTitle('stopped', 'Microsoft', 'The run stopped at Fetch pages')).toBe('The run stopped at Fetch pages')
    expect(getRunTitle('not-found', null, 'Run not found')).toBe('Run not found')
  })
})

describe('getResultCopy', () => {
  it('says how long a finished run took', () => {
    const copy = getResultCopy({ isPartial: false, isSummaryOnly: false, elapsedMs: 10800 })
    expect(copy.heading).toBe('The guide is ready')
    expect(copy.lead).toContain('10.8 seconds')
  })

  it('quotes no numbers for a run whose trace is gone', () => {
    const copy = getResultCopy({ isPartial: false, isSummaryOnly: true, elapsedMs: 0 })
    expect(copy.lead).toBe('This run finished earlier. Its trace is no longer kept, but the guide is saved.')
    expect(copy.lead).not.toMatch(/\d/)
  })

  it('names the time limit for a partial run, and says finished earlier when the trace is gone', () => {
    expect(getResultCopy({ isPartial: true, isSummaryOnly: false, elapsedMs: 0 }).lead).toContain('120 second limit')
    expect(getResultCopy({ isPartial: true, isSummaryOnly: true, elapsedMs: 0 }).lead).toContain('finished earlier')
  })
})

describe('getResultActions', () => {
  it('opens the guide the run saved, which can differ from the one asked for', () => {
    expect(getResultActions('hubspot', false)).toEqual([
      { kind: 'link', label: 'Open the guide', to: '/g/hubspot', variant: 'primary' },
    ])
  })

  it('offers the partial guide and a retry when the run is partial', () => {
    const actions = getResultActions('stub-check', true)
    expect(actions.map((action) => action.label)).toEqual(['Open the partial guide', 'Retry run'])
    expect(actions[1]).toMatchObject({ kind: 'new-run' })
  })
})
