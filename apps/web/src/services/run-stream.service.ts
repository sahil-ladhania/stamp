/**
 * File: run-stream.service.ts
 * Purpose: Follows one run over GET /api/runs/:id/stream with the browser EventSource (Axios cannot stream SSE).
 *          Parses each named event with the shared schema, routes it to its handler, and closes on a terminal event.
 *          The server replays the whole run (snapshot first) on every connect, so a browser reconnect needs no extra code.
 * Exports: RunStreamEventType, RunStreamStatus, RunStreamHandlers, dispatchRunEvent, subscribeToRun
 * Used by: hooks/useRunStream.ts
 */
import { RunStreamEventSchema, type RunStreamEvent } from '@stamp/schema'
import { ApiError } from '@/lib/api-error'
import { apiUrl } from '@/lib/config'
import { toApiError } from '@/lib/to-api-error'
import { isTerminalEvent } from '@/utils/is-terminal-event'
import { getRun } from './runs.service'

export type RunStreamEventType = RunStreamEvent['type']
export type RunStreamStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

type EventOf<K extends RunStreamEventType> = Extract<RunStreamEvent, { type: K }>

export type RunStreamHandlers = {
  [K in RunStreamEventType]?: (event: EventOf<K>) => void
} & {
  /** Called for every valid event, before its own handler. */
  onEvent?: (event: RunStreamEvent) => void
  onStatus?: (status: RunStreamStatus) => void
  /** The stream is over and will not recover: the run is unknown, the reply was invalid, or the server is gone. */
  onFailure?: (error: ApiError) => void
}

// A Record, so adding an event to the shared schema is a compile error until it is listed here.
const EVENT_TYPES: Record<RunStreamEventType, true> = {
  'run.snapshot': true,
  'stage.started': true,
  'stage.done': true,
  'app.resolved': true,
  'search.query': true,
  'page.fetched': true,
  'claim.verified': true,
  'claim.downgraded': true,
  'run.done': true,
  'run.error': true,
}

/** Calls the handler that matches the event's type. */
export function dispatchRunEvent(event: RunStreamEvent, handlers: RunStreamHandlers): void {
  handlers.onEvent?.(event)
  switch (event.type) {
    case 'run.snapshot':
      return handlers['run.snapshot']?.(event)
    case 'stage.started':
      return handlers['stage.started']?.(event)
    case 'stage.done':
      return handlers['stage.done']?.(event)
    case 'app.resolved':
      return handlers['app.resolved']?.(event)
    case 'search.query':
      return handlers['search.query']?.(event)
    case 'page.fetched':
      return handlers['page.fetched']?.(event)
    case 'claim.verified':
      return handlers['claim.verified']?.(event)
    case 'claim.downgraded':
      return handlers['claim.downgraded']?.(event)
    case 'run.done':
      return handlers['run.done']?.(event)
    case 'run.error':
      return handlers['run.error']?.(event)
  }
}

/** Null means the payload is not a valid event; the caller turns that into an INVALID_RESPONSE failure. */
function parseStreamEvent(data: unknown): RunStreamEvent | null {
  if (typeof data !== 'string') return null
  let json: unknown
  try {
    json = JSON.parse(data)
  } catch {
    return null
  }
  const result = RunStreamEventSchema.safeParse(json)
  return result.success ? result.data : null
}

/** A closed EventSource hides the HTTP status from scripts, so ask the API why: an unknown run or a lost connection. */
async function explainClosedStream(runId: string): Promise<ApiError> {
  try {
    await getRun(runId)
    return new ApiError('NETWORK', 'The run stream closed before the run ended.')
  } catch (error) {
    return toApiError(error)
  }
}

/** Starts following a run. Returns an unsubscribe function that closes the connection and stops all callbacks. */
export function subscribeToRun(runId: string, handlers: RunStreamHandlers): () => void {
  const source = new EventSource(apiUrl(`/api/runs/${encodeURIComponent(runId)}/stream`))
  let isActive = true
  let isExplaining = false

  function close(): void {
    isActive = false
    source.close()
  }

  function fail(error: ApiError): void {
    if (!isActive) return
    close()
    handlers.onStatus?.('closed')
    handlers.onFailure?.(error)
  }

  function handleMessage(message: MessageEvent): void {
    if (!isActive) return
    const event = parseStreamEvent(message.data)
    if (!event || event.type !== message.type) {
      fail(new ApiError('INVALID_RESPONSE', 'The run stream sent an event that does not match the shared schema.'))
      return
    }
    dispatchRunEvent(event, handlers)
    if (isTerminalEvent(event)) {
      close()
      handlers.onStatus?.('closed')
    }
  }

  async function handleError(): Promise<void> {
    if (!isActive || isExplaining) return
    // CONNECTING means the browser is retrying on its own; the server then replays the run from the snapshot.
    if (source.readyState !== EventSource.CLOSED) {
      handlers.onStatus?.('reconnecting')
      return
    }
    isExplaining = true
    fail(await explainClosedStream(runId))
  }

  handlers.onStatus?.('connecting')
  source.addEventListener('open', () => {
    if (isActive) handlers.onStatus?.('open')
  })
  source.addEventListener('error', () => void handleError())
  for (const type of Object.keys(EVENT_TYPES)) {
    source.addEventListener(type, handleMessage)
  }

  return close
}
