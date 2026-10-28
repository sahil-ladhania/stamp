/**
 * File: is-terminal-event.ts
 * Purpose: True for the two stream events that end a run: run.done and run.error.
 * Exports: isTerminalEvent
 * Used by: services/run-stream.service.ts, utils/run-stream-state.ts
 */
import type { RunStreamEvent } from '@stamp/schema'

/** After a terminal event the server closes the stream, so the client must close it too. */
export function isTerminalEvent(event: Pick<RunStreamEvent, 'type'>): boolean {
  return event.type === 'run.done' || event.type === 'run.error'
}
