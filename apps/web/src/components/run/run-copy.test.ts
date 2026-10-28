/**
 * File: run-copy.test.ts
 * Purpose: Tests the Live run wording and actions for every outcome: running, done, partial, finished earlier,
 *          each run error, a failed stream, and the status line.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api-error'
import { runEvent } from '@/test-support/sample-data'
import { deriveRunView, type RunViewEvent } from '@/utils/run-view'
import { getRunCopy, getRunStatusLine, getStreamFailureCopy, type RunCopyContext } from './run-copy'

const context: RunCopyContext = { appName: 'Stub Check', elapsedMs: 9500, isSummaryOnly: false }
const done = runEvent('run.done', { slug: 'stub-check', status: 'done' })
const read: RunViewEvent[] = [
  runEvent('page.fetched', { url: 'https://docs.example.com/a', tier: 'official' }),
  runEvent('claim.verified', { claimId: 'steps.1', url: 'https://docs.example.com/a' }),
  runEvent('claim.downgraded', { claimId: 'limits.0', reason: 'quote_not_found' }),
]

function copyFor(events: RunViewEvent[], overrides: Partial<RunCopyContext> = {}) {
  return getRunCopy(deriveRunView(events), { ...context, ...overrides })
}

describe('getRunCopy while running', () => {
  it('names the app and offers no action', () => {
    const copy = copyFor([])
    expect(copy.heading).toBe('Researching Stub Check')
    expect(copy.actions).toEqual([])
  })

  it('says "this app" before the name is known', () => {
    expect(copyFor([], { appName: null }).heading).toBe('Researching this app')
  })
})

describe('getRunCopy when the run is done', () => {
  it('opens the guide and quotes the counts from the events', () => {
    const copy = copyFor([...read, done])
    expect(copy.heading).toBe('Stub Check guide is ready')
    expect(copy.lead).toContain('1 page')
    expect(copy.lead).toContain('1 claim')
    expect(copy.actions).toEqual([
      { kind: 'link', label: 'Open the guide', to: '/g/stub-check', variant: 'primary' },
    ])
  })

  it('links to the slug the run saved, which can differ from the one asked for', () => {
    const saved = runEvent('run.done', { slug: 'hubspot', status: 'done' })
    expect(copyFor([saved]).actions[0]).toMatchObject({ to: '/g/hubspot' })
  })

  it('offers the partial guide and a retry when the run is partial', () => {
    const copy = copyFor([runEvent('run.done', { slug: 'stub-check', status: 'partial' })])
    expect(copy.heading).toBe('Stub Check guide is partial')
    expect(copy.actions.map((action) => action.label)).toEqual(['Open the partial guide', 'Retry run'])
    expect(copy.actions[1]).toMatchObject({ kind: 'new-run' })
  })

  it('does not quote counts for a run whose trace is gone', () => {
    const copy = copyFor([done], { isSummaryOnly: true })
    expect(copy.lead).toBe('This run finished earlier. Its trace is no longer kept, but the guide is saved.')
    expect(copy.lead).not.toMatch(/\d/)
  })

  it('says a partial run finished earlier when its trace is gone', () => {
    const copy = copyFor([runEvent('run.done', { slug: 'x', status: 'partial' })], { isSummaryOnly: true })
    expect(copy.lead).toContain('finished earlier')
  })
})

describe('getRunCopy for each run error', () => {
  const fail = (code: 'NOT_OAUTH' | 'NO_PUBLIC_DOCS' | 'AMBIGUOUS_APP' | 'INTERNAL', extra = {}) =>
    copyFor([runEvent('run.error', { stage: 3, code, message: 'x', ...extra })])

  it('marks a not-OAuth app out of scope, with a next action', () => {
    const copy = fail('NOT_OAUTH')
    expect(copy.heading).toBe('This app is out of scope')
    expect(copy.actions[0]).toMatchObject({ kind: 'link', label: 'Search for another app', to: '/app' })
  })

  it('says there are no public docs, with a next action', () => {
    const copy = fail('NO_PUBLIC_DOCS')
    expect(copy.heading).toBe('No public docs for this app')
    expect(copy.actions).toHaveLength(1)
  })

  it('leaves the choice to the options panel when there are options', () => {
    const copy = fail('AMBIGUOUS_APP', { options: [{ name: 'A', domain: 'a.example.com' }] })
    expect(copy.heading).toBe('More than one app matches')
    expect(copy.actions).toEqual([])
  })

  it('sends the visitor to search again when the options were lost', () => {
    expect(fail('AMBIGUOUS_APP').actions[0]).toMatchObject({ label: 'Search for another app' })
  })

  it('names the stage that stopped and offers a retry and the library', () => {
    const copy = fail('INTERNAL')
    expect(copy.heading).toBe('The run stopped at Fetch pages')
    expect(copy.actions).toEqual([
      { kind: 'new-run', label: 'Retry run', variant: 'primary' },
      { kind: 'link', label: 'Open the library', to: '/app', variant: 'secondary' },
    ])
  })
})

describe('getStreamFailureCopy', () => {
  it('says the run was not found and sends the visitor to search', () => {
    const copy = getStreamFailureCopy(new ApiError('NOT_FOUND', 'Run not found.', { status: 404 }))
    expect(copy.heading).toBe('Run not found')
    expect(copy.actions).toEqual([
      { kind: 'link', label: 'Search for an app', to: '/app', variant: 'primary' },
    ])
  })

  it('offers to reconnect after a lost connection', () => {
    const copy = getStreamFailureCopy(new ApiError('NETWORK', 'Lost.'))
    expect(copy.heading).toBe('Stamp lost the run')
    expect(copy.lead).toContain('could not reach the server')
    expect(copy.actions[0]).toMatchObject({ kind: 'reconnect', variant: 'primary' })
  })
})

describe('getRunStatusLine', () => {
  const base = { isRunning: true, isConnecting: false, currentStageName: null, heading: 'Done' }

  it('names the current stage while running', () => {
    expect(getRunStatusLine({ ...base, currentStageName: 'Search' })).toBe('Now: Search.')
  })

  it('says it is connecting before the first event', () => {
    expect(getRunStatusLine({ ...base, isConnecting: true })).toBe('Connecting to the run.')
  })

  it('is empty between stages', () => {
    expect(getRunStatusLine(base)).toBe('')
  })

  it('repeats the heading once the run ends', () => {
    expect(getRunStatusLine({ ...base, isRunning: false, heading: 'Stub Check guide is ready' })).toBe(
      'Stub Check guide is ready.',
    )
  })
})
