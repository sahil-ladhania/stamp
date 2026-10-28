/**
 * File: fake-event-source.ts
 * Purpose: Test helper. A stand-in for the browser EventSource that the test drives by hand: open, send a named
 *          event, fail. Install it with installFakeEventSource() and remove it with vi.unstubAllGlobals().
 * Exports: FakeEventSource, installFakeEventSource
 * Used by: services/run-stream.service.test.ts
 */
import { vi } from 'vitest'

type Listener = (event: { type: string; data?: string }) => void

export class FakeEventSource {
  static instances: FakeEventSource[] = []
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2

  readonly url: string
  readyState: number = FakeEventSource.CONNECTING
  readonly listeners = new Map<string, Listener[]>()

  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }

  close(): void {
    this.readyState = FakeEventSource.CLOSED
  }

  /** The connection is established. */
  open(): void {
    this.readyState = FakeEventSource.OPEN
    this.emit('open')
  }

  /** The server sends a named event. A non-string payload is sent as JSON. */
  send(type: string, payload: unknown): void {
    this.emit(type, typeof payload === 'string' ? payload : JSON.stringify(payload))
  }

  /** CONNECTING means the browser will retry by itself; CLOSED means it gave up. */
  fail(readyState: typeof FakeEventSource.CONNECTING | typeof FakeEventSource.CLOSED): void {
    this.readyState = readyState
    this.emit('error')
  }

  private emit(type: string, data?: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener({ type, data })
  }
}

/** Replaces the global EventSource and returns the connection the code under test opened last. */
export function installFakeEventSource(): { latest: () => FakeEventSource } {
  FakeEventSource.instances = []
  vi.stubGlobal('EventSource', FakeEventSource)
  return {
    latest: () => {
      const source = FakeEventSource.instances.at(-1)
      if (!source) throw new Error('No EventSource was opened')
      return source
    },
  }
}
