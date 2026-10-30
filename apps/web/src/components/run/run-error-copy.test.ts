/**
 * File: run-error-copy.test.ts
 * Purpose: Tests the wording and actions for each run error code, a stream that failed, and a run that is unknown.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api-error'
import { getErrorNotice, getStreamFailureNotice } from './run-error-copy'

describe('getErrorNotice', () => {
  it('marks a not-OAuth app out of scope, with a next action', () => {
    const notice = getErrorNotice('NOT_OAUTH', 3, false)
    expect(notice.title).toBe('This app is out of scope')
    expect(notice.actions[0]).toMatchObject({ kind: 'link', label: 'Search for another app', to: '/app' })
  })

  it('says there are no public docs, with a next action', () => {
    const notice = getErrorNotice('NO_PUBLIC_DOCS', 3, false)
    expect(notice.title).toBe('No public docs for this app')
    expect(notice.actions).toHaveLength(1)
  })

  it('leaves the choice to the options when there are options', () => {
    const notice = getErrorNotice('AMBIGUOUS_APP', 0, true)
    expect(notice.title).toBe('Which app do you mean?')
    expect(notice.actions).toEqual([])
  })

  it('sends the visitor to search again when the options were lost', () => {
    expect(getErrorNotice('AMBIGUOUS_APP', 0, false).actions[0]).toMatchObject({ label: 'Search for another app' })
  })

  it('names the stage that stopped and offers a retry and the library', () => {
    const notice = getErrorNotice('INTERNAL', 3, false)
    expect(notice.title).toBe('The run stopped at Fetch pages')
    expect(notice.actions).toEqual([
      { kind: 'new-run', label: 'Retry run', variant: 'primary' },
      { kind: 'link', label: 'Open the library', to: '/app', variant: 'secondary' },
    ])
  })
})

describe('getStreamFailureNotice', () => {
  it('says the run was not found and sends the visitor to search', () => {
    const notice = getStreamFailureNotice(new ApiError('NOT_FOUND', 'Run not found.', { status: 404 }))
    expect(notice.title).toBe('Run not found')
    expect(notice.actions).toEqual([{ kind: 'link', label: 'Search for an app', to: '/app', variant: 'primary' }])
  })

  it('offers to reconnect after a lost connection', () => {
    const notice = getStreamFailureNotice(new ApiError('NETWORK', 'Lost.'))
    expect(notice.title).toBe('Stamp lost the run')
    expect(notice.lead).toContain('could not reach the server')
    expect(notice.actions[0]).toMatchObject({ kind: 'reconnect', variant: 'primary' })
  })
})
