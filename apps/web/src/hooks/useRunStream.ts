/**
 * File: useRunStream.ts
 * Purpose: Follows one run over the stream service and returns what the Live run page shows: the snapshot, the
 *          derived view (stage status, trace, claim counts, final outcome), the connection state and any failure.
 *          Closes the connection on unmount or when the run id changes.
 * Exports: UseRunStreamResult, useRunStream
 * Used by: components/run/RunScreen.tsx
 */
import type { RunSnapshot } from '@stamp/schema'
import { useEffect, useReducer } from 'react'
import type { ApiError } from '@/lib/api-error'
import { subscribeToRun, type RunStreamStatus } from '@/services/run-stream.service'
import {
  INITIAL_RUN_STREAM_STATE,
  runStreamReducer,
} from '@/utils/run-stream-state'
import { deriveRunView, type RunView, type RunViewEvent } from '@/utils/run-view'

export type UseRunStreamResult = {
  snapshot: RunSnapshot | null
  view: RunView
  /** The events of the current replay, oldest first, for the grouped trace. */
  events: RunViewEvent[]
  connection: RunStreamStatus
  error: ApiError | null
}

/** Pass null to wait (no connection is opened). */
export function useRunStream(runId: string | null): UseRunStreamResult {
  const [state, dispatch] = useReducer(runStreamReducer, INITIAL_RUN_STREAM_STATE)

  useEffect(() => {
    if (runId === null) return
    dispatch({ type: 'reset' })
    return subscribeToRun(runId, {
      onEvent: (event) => dispatch({ type: 'event', event }),
      onStatus: (status) => dispatch({ type: 'status', status }),
      onFailure: (error) => dispatch({ type: 'failure', error }),
    })
  }, [runId])

  return {
    snapshot: state.snapshot,
    view: deriveRunView(state.events),
    events: state.events,
    connection: state.status,
    error: state.error,
  }
}
