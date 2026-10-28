/**
 * File: run-stream-state.test.ts
 * Purpose: Tests the run stream reducer: events append, a snapshot clears the replay so a reconnect never
 *          duplicates rows, a terminal event ends the run, and failures close the stream.
 * Exports: none
 * Used by: vitest
 */
import type { RunStreamEvent } from '@stamp/schema'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api-error'
import { runEvent, sampleSnapshot } from '@/test-support/sample-data'
import {
  INITIAL_RUN_STREAM_STATE,
  runStreamReducer,
  type RunStreamAction,
  type RunStreamState,
} from './run-stream-state'

const snapshot = runEvent('run.snapshot', { snapshot: sampleSnapshot })
const started = runEvent('stage.started', { stage: 0, name: 'resolve_app' })
const query = runEvent('search.query', { query: 'example oauth' })
const done = runEvent('run.done', { slug: 'example', status: 'done' })

function play(events: RunStreamEvent[], from: RunStreamState = INITIAL_RUN_STREAM_STATE): RunStreamState {
  return events.reduce<RunStreamState>(
    (state, event) => runStreamReducer(state, { type: 'event', event }),
    from,
  )
}

describe('runStreamReducer events', () => {
  it('keeps the snapshot apart from the events', () => {
    const state = play([snapshot, started])
    expect(state.snapshot).toEqual(sampleSnapshot)
    expect(state.events).toEqual([started])
  })

  it('appends events in order', () => {
    expect(play([snapshot, started, query]).events).toEqual([started, query])
  })

  it('clears the events when a snapshot arrives, so a reconnect replay shows each row once', () => {
    const firstConnection = play([snapshot, started, query])
    const afterReconnect = play([snapshot, started, query], firstConnection)
    expect(afterReconnect.events).toEqual([started, query])
  })

  it('shows the newer snapshot after a replay', () => {
    const newer = runEvent('run.snapshot', { snapshot: { ...sampleSnapshot, stageReached: 3 } })
    expect(play([newer], play([snapshot, started])).snapshot?.stageReached).toBe(3)
  })

  it('ignores events after the terminal event', () => {
    const state = play([snapshot, started, done, query])
    expect(state.events).toEqual([started, done])
  })

  it('accepts a fresh snapshot and replay after a terminal event', () => {
    const finished = play([snapshot, started, done])
    expect(play([snapshot, started], finished).events).toEqual([started])
  })

  it('does not change the other fields when an event arrives', () => {
    const state = runStreamReducer(
      { ...INITIAL_RUN_STREAM_STATE, status: 'open' },
      { type: 'event', event: started },
    )
    expect(state.status).toBe('open')
  })
})

describe('runStreamReducer status, failure and reset', () => {
  it('sets the connection status', () => {
    const action: RunStreamAction = { type: 'status', status: 'reconnecting' }
    expect(runStreamReducer(INITIAL_RUN_STREAM_STATE, action).status).toBe('reconnecting')
  })

  it('clears an earlier failure when a snapshot arrives', () => {
    const failed = runStreamReducer(INITIAL_RUN_STREAM_STATE, {
      type: 'failure',
      error: new ApiError('NETWORK', 'Lost.'),
    })
    expect(play([snapshot], failed).error).toBeNull()
  })

  it('records a failure and closes the stream', () => {
    const error = new ApiError('NOT_FOUND', 'Run not found.')
    const state = runStreamReducer(INITIAL_RUN_STREAM_STATE, { type: 'failure', error })
    expect(state).toMatchObject({ status: 'closed', error })
  })

  it('starts again from nothing on reset', () => {
    const state = runStreamReducer(play([snapshot, started]), { type: 'reset' })
    expect(state).toBe(INITIAL_RUN_STREAM_STATE)
  })
})
