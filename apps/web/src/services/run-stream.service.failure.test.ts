/**
 * File: run-stream.service.failure.test.ts
 * Purpose: Tests subscribeToRun when the connection drops: the browser retrying by itself, and the browser
 *          giving up, where the service asks the API whether the run exists.
 * Exports: none
 * Used by: vitest
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeEventSource, installFakeEventSource } from '@/test-support/fake-event-source'
import { installMockAdapter } from '@/test-support/mock-adapter'
import { RUN_ID, runEvent, sampleSnapshot } from '@/test-support/sample-data'
import { subscribeToRun } from './run-stream.service'

let latest: () => FakeEventSource
let restoreAdapter: () => void = () => {}

beforeEach(() => {
  latest = installFakeEventSource().latest
})

afterEach(() => {
  vi.unstubAllGlobals()
  restoreAdapter()
  restoreAdapter = () => {}
})

const snapshot = runEvent('run.snapshot', { snapshot: sampleSnapshot })

describe('subscribeToRun reconnects', () => {
  it('reports reconnecting while the browser retries, and keeps routing events after it', () => {
    const onStatus = vi.fn()
    const onSnapshot = vi.fn()
    subscribeToRun(RUN_ID, { onStatus, 'run.snapshot': onSnapshot })
    latest().open()
    latest().fail(FakeEventSource.CONNECTING)
    latest().open()
    latest().send('run.snapshot', snapshot)
    expect(onStatus.mock.calls).toEqual([['connecting'], ['open'], ['reconnecting'], ['open']])
    expect(onSnapshot).toHaveBeenCalledOnce()
  })
})

describe('subscribeToRun when the browser gives up', () => {
  it('fails with NOT_FOUND when the API does not know the run', async () => {
    restoreAdapter = installMockAdapter({
      status: 404,
      data: { error: { code: 'NOT_FOUND', message: 'Run not found.' } },
    }).restore
    const onFailure = vi.fn()
    const onStatus = vi.fn()
    subscribeToRun('run_x', { onFailure, onStatus })
    latest().fail(FakeEventSource.CLOSED)
    await vi.waitFor(() => expect(onFailure).toHaveBeenCalledOnce())
    expect(onFailure.mock.calls[0]?.[0]).toMatchObject({ code: 'NOT_FOUND' })
    expect(onStatus).toHaveBeenLastCalledWith('closed')
  })

  it('fails with NETWORK when the run exists but the stream is gone', async () => {
    restoreAdapter = installMockAdapter({ status: 200, data: sampleSnapshot }).restore
    const onFailure = vi.fn()
    subscribeToRun(RUN_ID, { onFailure })
    latest().fail(FakeEventSource.CLOSED)
    await vi.waitFor(() => expect(onFailure).toHaveBeenCalledOnce())
    expect(onFailure.mock.calls[0]?.[0]).toMatchObject({ code: 'NETWORK' })
  })

  it('fails with NETWORK when the API cannot be reached either', async () => {
    restoreAdapter = installMockAdapter({ failure: 'network' }).restore
    const onFailure = vi.fn()
    subscribeToRun(RUN_ID, { onFailure })
    latest().fail(FakeEventSource.CLOSED)
    await vi.waitFor(() => expect(onFailure).toHaveBeenCalledOnce())
    expect(onFailure.mock.calls[0]?.[0]).toMatchObject({ code: 'NETWORK' })
  })

  it('reports nothing if the caller unsubscribed while the probe was in flight', async () => {
    const mock = installMockAdapter({ status: 404, data: { error: { code: 'NOT_FOUND', message: 'x' } } })
    restoreAdapter = mock.restore
    const onFailure = vi.fn()
    const unsubscribe = subscribeToRun(RUN_ID, { onFailure })
    latest().fail(FakeEventSource.CLOSED)
    unsubscribe()
    await vi.waitFor(() => expect(mock.calls).toHaveLength(1))
    await Promise.resolve()
    expect(onFailure).not.toHaveBeenCalled()
  })
})
