/**
 * File: run-stream.service.test.ts
 * Purpose: Tests subscribeToRun with a fake EventSource: URL, handler routing, closing on terminal events,
 *          unsubscribe and invalid payloads. Reconnects and the closed-stream probe are in run-stream.service.failure.test.ts.
 * Exports: none
 * Used by: vitest
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeEventSource, installFakeEventSource } from '@/test-support/fake-event-source'
import { RUN_ID, runEvent, sampleSnapshot } from '@/test-support/sample-data'
import { subscribeToRun, type RunStreamHandlers } from './run-stream.service'

let latest: () => FakeEventSource

beforeEach(() => {
  latest = installFakeEventSource().latest
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const snapshot = runEvent('run.snapshot', { snapshot: sampleSnapshot })
const done = runEvent('run.done', { slug: 'example', status: 'done' })

describe('subscribeToRun connection', () => {
  it('opens the stream URL for the run, with the id encoded', () => {
    subscribeToRun('run/1', {})
    expect(latest().url).toBe('/api/runs/run%2F1/stream')
  })

  it('reports connecting, then open', () => {
    const onStatus = vi.fn()
    subscribeToRun(RUN_ID, { onStatus })
    latest().open()
    expect(onStatus.mock.calls).toEqual([['connecting'], ['open']])
  })
})

describe('subscribeToRun routing', () => {
  it('calls the handler that matches each event type, and onEvent first', () => {
    const calls: string[] = []
    const handlers: RunStreamHandlers = {
      onEvent: (event) => calls.push(`any:${event.type}`),
      'run.snapshot': () => calls.push('snapshot'),
      'stage.started': () => calls.push('started'),
      'stage.done': () => calls.push('stage-done'),
      'app.resolved': () => calls.push('resolved'),
      'search.query': () => calls.push('query'),
      'page.fetched': () => calls.push('page'),
      'claim.verified': () => calls.push('verified'),
      'claim.downgraded': () => calls.push('downgraded'),
      'run.done': () => calls.push('done'),
    }
    subscribeToRun(RUN_ID, handlers)
    const events = [
      snapshot,
      runEvent('stage.started', { stage: 2, name: 'search' }),
      runEvent('stage.done', { stage: 2, durationMs: 900 }),
      runEvent('app.resolved', { appName: 'Gmail', domain: 'google.com', product: 'Gmail API' }),
      runEvent('search.query', { query: 'example oauth' }),
      runEvent('page.fetched', { url: 'https://docs.example.com/a', tier: 'official' }),
      runEvent('claim.verified', { claimId: 'steps.1', url: 'https://docs.example.com/a' }),
      runEvent('claim.downgraded', { claimId: 'steps.2', reason: 'quote_not_found' }),
      done,
    ]
    for (const event of events) latest().send(event.type, event)

    expect(calls).toEqual([
      'any:run.snapshot', 'snapshot',
      'any:stage.started', 'started',
      'any:stage.done', 'stage-done',
      'any:app.resolved', 'resolved',
      'any:search.query', 'query',
      'any:page.fetched', 'page',
      'any:claim.verified', 'verified',
      'any:claim.downgraded', 'downgraded',
      'any:run.done', 'done',
    ])
  })

  it('hands the handler the parsed event, including run.error options', () => {
    const onError = vi.fn()
    subscribeToRun(RUN_ID, { 'run.error': onError })
    const event = runEvent('run.error', {
      stage: 0,
      code: 'AMBIGUOUS_APP',
      message: 'Pick one.',
      options: [{ name: 'Stub Alpha', domain: 'alpha.example.com' }],
    })
    latest().send('run.error', event)
    expect(onError).toHaveBeenCalledWith(event)
  })
})

describe('subscribeToRun closing', () => {
  it('closes the connection and reports closed after run.done, and ignores later events', () => {
    const onStatus = vi.fn()
    const onEvent = vi.fn()
    subscribeToRun(RUN_ID, { onStatus, onEvent })
    latest().send('run.done', done)
    expect(latest().readyState).toBe(FakeEventSource.CLOSED)
    expect(onStatus).toHaveBeenLastCalledWith('closed')

    latest().send('search.query', runEvent('search.query', { query: 'late' }))
    expect(onEvent).toHaveBeenCalledTimes(1)
  })

  it('closes the connection after run.error', () => {
    const onStatus = vi.fn()
    subscribeToRun(RUN_ID, { onStatus })
    latest().send('run.error', runEvent('run.error', { stage: 3, code: 'NOT_OAUTH', message: 'API keys.' }))
    expect(latest().readyState).toBe(FakeEventSource.CLOSED)
    expect(onStatus).toHaveBeenLastCalledWith('closed')
  })

  it('unsubscribe closes the connection and stops every callback', () => {
    const onEvent = vi.fn()
    const onStatus = vi.fn()
    const unsubscribe = subscribeToRun(RUN_ID, { onEvent, onStatus })
    unsubscribe()
    expect(latest().readyState).toBe(FakeEventSource.CLOSED)

    latest().open()
    latest().send('run.snapshot', snapshot)
    expect(onEvent).not.toHaveBeenCalled()
    expect(onStatus.mock.calls).toEqual([['connecting']])
  })
})

describe('subscribeToRun invalid payloads', () => {
  it.each([
    ['text that is not JSON', 'not json'],
    ['an event the schema rejects', JSON.stringify({ ...runEvent('stage.done', { stage: 99, durationMs: 1 }) })],
    ['an event whose type differs from its event name', JSON.stringify(runEvent('search.query', { query: 'x' }))],
  ])('fails with INVALID_RESPONSE and closes on %s', (_name, payload) => {
    const onFailure = vi.fn()
    const onEvent = vi.fn()
    subscribeToRun(RUN_ID, { onFailure, onEvent })
    latest().send('stage.done', payload)
    expect(onEvent).not.toHaveBeenCalled()
    expect(onFailure).toHaveBeenCalledOnce()
    expect(onFailure.mock.calls[0]?.[0]).toMatchObject({ code: 'INVALID_RESPONSE' })
    expect(latest().readyState).toBe(FakeEventSource.CLOSED)
  })
})
