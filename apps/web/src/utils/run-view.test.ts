/**
 * File: run-view.test.ts
 * Purpose: Tests deriveRunView: stage status, the retry pass, counts and the outcome.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { runEvent } from '@/test-support/sample-data'
import { deriveRunView, type RunViewEvent } from './run-view'

const started = (stage: number): RunViewEvent => runEvent('stage.started', { stage, name: `stage_${stage}` })
const finished = (stage: number, durationMs = 1000): RunViewEvent => runEvent('stage.done', { stage, durationMs })

function statuses(events: RunViewEvent[]): string[] {
  return deriveRunView(events).stages.map((stage) => stage.status)
}

describe('deriveRunView stages while the run is live', () => {
  it('shows every stage as waiting before the first event', () => {
    expect(statuses([])).toEqual(Array(9).fill('waiting'))
  })

  it('shows finished stages as done with their time, the newest as running and the rest as waiting', () => {
    const view = deriveRunView([started(0), finished(0, 600), started(1)])
    expect(view.stages.map((stage) => stage.status)).toEqual([
      'done', 'running', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting',
    ])
    expect(view.stages[0]?.durationMs).toBe(600)
    expect(view.currentStage?.stage).toBe(1)
  })

  it('names stages from the UI list, not from the wire name', () => {
    expect(deriveRunView([started(0)]).stages[0]?.name).toBe('Resolve app')
  })
})

describe('deriveRunView retry pass', () => {
  const firstPass = [
    started(0), finished(0), started(1), finished(1), started(2), finished(2),
    started(3), finished(3), started(4), finished(4), started(5), finished(5),
  ]

  it('shows Search as running again and the stages after it as waiting', () => {
    expect(statuses([...firstPass, started(2)])).toEqual([
      'done', 'done', 'running', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting',
    ])
  })

  it('shows the retry stage with the time of its latest pass once it finishes', () => {
    const view = deriveRunView([...firstPass, started(2), finished(2, 450)])
    expect(view.stages[2]).toMatchObject({ status: 'done', durationMs: 450 })
    expect(view.stages[3]?.status).toBe('waiting')
  })

  it('shows every stage as done after the retry pass runs through to Save', () => {
    const retryPass = [
      started(2), finished(2), started(3), finished(3), started(4), finished(4), started(5), finished(5),
      started(6), finished(6), started(7), finished(7), started(8), finished(8),
      runEvent('run.done', { slug: 'example', status: 'done' }),
    ]
    expect(statuses([...firstPass, ...retryPass])).toEqual(Array(9).fill('done'))
  })

  it('counts the second start of Search as one retry, and none before it', () => {
    expect(deriveRunView(firstPass).retries).toBe(0)
    expect(deriveRunView([...firstPass, started(2)]).retries).toBe(1)
  })
})

describe('deriveRunView after the run ends', () => {
  it('marks a stage that started but never finished as stopped, and later stages as not run, after an error', () => {
    const view = deriveRunView([
      started(0), finished(0), started(1), finished(1), started(2), finished(2), started(3),
      runEvent('run.error', { stage: 3, code: 'INTERNAL', message: 'Failed.' }),
    ])
    expect(view.stages.map((stage) => stage.status)).toEqual([
      'done', 'done', 'done', 'stopped', 'not-run', 'not-run', 'not-run', 'not-run', 'not-run',
    ])
    expect(view.currentStage).toBeNull()
  })

  it('marks a stage that a timeout skipped past as stopped', () => {
    const view = deriveRunView([
      started(4), started(8), finished(8),
      runEvent('run.done', { slug: 'example', status: 'partial' }),
    ])
    expect(view.stages[4]?.status).toBe('stopped')
    expect(view.stages[8]?.status).toBe('done')
  })

  it('reports a finished run with its slug and status', () => {
    const view = deriveRunView([runEvent('run.done', { slug: 'example', status: 'partial' })])
    expect(view.outcome).toEqual({ kind: 'done', slug: 'example', status: 'partial' })
  })

  it('reports a run error with its code, message and the apps to choose from', () => {
    const options = [{ name: 'Stub Alpha', domain: 'alpha.example.com' }]
    const view = deriveRunView([
      runEvent('run.error', { stage: 0, code: 'AMBIGUOUS_APP', message: 'Pick one.', options }),
    ])
    expect(view.outcome).toEqual({
      kind: 'error', stage: 0, code: 'AMBIGUOUS_APP', message: 'Pick one.', options,
    })
  })

  it('gives no options when the error has none', () => {
    const view = deriveRunView([runEvent('run.error', { stage: 3, code: 'NOT_OAUTH', message: 'Keys.' })])
    expect(view.outcome).toMatchObject({ kind: 'error', options: [] })
  })

  it('reports running until a terminal event arrives', () => {
    expect(deriveRunView([started(0)]).outcome).toEqual({ kind: 'running' })
  })
})

describe('deriveRunView counts', () => {
  const events: RunViewEvent[] = [
    started(2),
    runEvent('search.query', { query: 'example oauth' }),
    runEvent('page.fetched', { url: 'https://docs.example.com/a', tier: 'official' }),
    runEvent('page.fetched', { url: 'https://forum.example.org/b', tier: 'forum' }),
    runEvent('claim.verified', { claimId: 'steps.1', url: 'https://docs.example.com/a' }),
    runEvent('claim.downgraded', { claimId: 'steps.2', reason: 'sources_disagree' }),
    runEvent('claim.downgraded', { claimId: 'limits.0', reason: 'quote_not_found' }),
    finished(2, 2200),
  ]
  const view = deriveRunView(events)

  it('counts pages read, claims kept and claims downgraded', () => {
    expect(view.pagesRead).toBe(2)
    expect(view.claimsKept).toBe(1)
    expect(view.claimsDowngraded).toBe(2)
  })
})
