/**
 * File: run-stream-state.ts
 * Purpose: Reducer behind useRunStream. Keeps the snapshot, the events of the current replay, the connection
 *          status and any failure. Every connect starts with a run.snapshot and replays the whole run, so a
 *          snapshot clears the events: a reconnect never shows a stage or a trace row twice.
 * Exports: RunStreamState, RunStreamAction, INITIAL_RUN_STREAM_STATE, runStreamReducer
 * Used by: hooks/useRunStream.ts
 */
import type { RunSnapshot, RunStreamEvent } from '@stamp/schema'
import type { ApiError } from '@/lib/api-error'
import type { RunStreamStatus } from '@/services/run-stream.service'
import { isTerminalEvent } from './is-terminal-event'
import type { RunViewEvent } from './run-view'

export type RunStreamState = {
  snapshot: RunSnapshot | null
  /** Oldest first, without the snapshot. Events carry their run id; the view does not read it. */
  events: RunViewEvent[]
  status: RunStreamStatus
  error: ApiError | null
}

export type RunStreamAction =
  | { type: 'reset' }
  | { type: 'event'; event: RunStreamEvent }
  | { type: 'status'; status: RunStreamStatus }
  | { type: 'failure'; error: ApiError }

export const INITIAL_RUN_STREAM_STATE: RunStreamState = {
  snapshot: null,
  events: [],
  status: 'connecting',
  error: null,
}

function applyEvent(state: RunStreamState, event: RunStreamEvent): RunStreamState {
  if (event.type === 'run.snapshot') {
    return { ...state, snapshot: event.snapshot, events: [], error: null }
  }
  // The server ends the stream after the terminal event; anything later is stale.
  if (state.events.some(isTerminalEvent)) return state
  return { ...state, events: [...state.events, event] }
}

export function runStreamReducer(
  state: RunStreamState,
  action: RunStreamAction,
): RunStreamState {
  switch (action.type) {
    case 'reset':
      return INITIAL_RUN_STREAM_STATE
    case 'event':
      return applyEvent(state, action.event)
    case 'status':
      return { ...state, status: action.status }
    case 'failure':
      return { ...state, status: 'closed', error: action.error }
  }
}
