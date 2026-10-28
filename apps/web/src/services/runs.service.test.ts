/**
 * File: runs.service.test.ts
 * Purpose: Tests the run services: the body sent, the three start results, the error replies and the snapshot.
 * Exports: none
 * Used by: vitest
 */
import { afterEach, describe, expect, it } from 'vitest'
import { installMockAdapter } from '@/test-support/mock-adapter'
import { RUN_ID, sampleSnapshot } from '@/test-support/sample-data'
import { createRun, getRun } from './runs.service'

let restore: () => void = () => {}
afterEach(() => restore())

describe('createRun', () => {
  it('posts the app to /api/runs', async () => {
    const mock = installMockAdapter({ status: 200, data: { status: 'cached', slug: 'notion' } })
    restore = mock.restore
    await createRun({ app: 'Notion' })
    expect(mock.calls).toMatchObject([{ method: 'post', url: '/api/runs', body: { app: 'Notion' } }])
  })

  it('sends force when asked to skip the cache', async () => {
    const mock = installMockAdapter({ status: 202, data: { status: 'started', runId: RUN_ID } })
    restore = mock.restore
    await createRun({ app: 'Notion', force: true })
    expect(mock.calls[0]?.body).toEqual({ app: 'Notion', force: true })
  })

  it.each([
    ['cached', 200, { status: 'cached', slug: 'notion' }],
    ['started', 202, { status: 'started', runId: RUN_ID }],
    ['running', 202, { status: 'running', runId: RUN_ID }],
  ])('returns the %s result', async (_name, status, data) => {
    restore = installMockAdapter({ status, data }).restore
    await expect(createRun({ app: 'Notion' })).resolves.toEqual(data)
  })

  it('rejects a 429 with RATE_LIMITED and the Retry-After wait', async () => {
    restore = installMockAdapter({
      status: 429,
      data: { error: { code: 'RATE_LIMITED', message: 'Too many runs. Try again in a minute.' } },
      headers: { 'retry-after': '42' },
    }).restore
    await expect(createRun({ app: 'Notion' })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
      retryAfter: 42,
    })
  })

  it('rejects a 503 with RUN_CAP_REACHED', async () => {
    restore = installMockAdapter({
      status: 503,
      data: { error: { code: 'RUN_CAP_REACHED', message: 'Live generation is paused. Try a library guide.' } },
    }).restore
    await expect(createRun({ app: 'Notion' })).rejects.toMatchObject({ code: 'RUN_CAP_REACHED' })
  })

  it('rejects a 400 with VALIDATION_ERROR', async () => {
    restore = installMockAdapter({
      status: 400,
      data: { error: { code: 'VALIDATION_ERROR', message: 'app: Too small.' } },
    }).restore
    await expect(createRun({ app: 'x' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('rejects a result the shared schema does not know with INVALID_RESPONSE', async () => {
    restore = installMockAdapter({ status: 200, data: { status: 'queued' } }).restore
    await expect(createRun({ app: 'Notion' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})

describe('getRun', () => {
  it('gets /api/runs/:id and returns the validated snapshot', async () => {
    const mock = installMockAdapter({ status: 200, data: sampleSnapshot })
    restore = mock.restore
    await expect(getRun(RUN_ID)).resolves.toEqual(sampleSnapshot)
    expect(mock.calls).toMatchObject([{ method: 'get', url: `/api/runs/${RUN_ID}` }])
  })

  it('rejects an unknown run with NOT_FOUND', async () => {
    restore = installMockAdapter({
      status: 404,
      data: { error: { code: 'NOT_FOUND', message: 'Run not found.' } },
    }).restore
    await expect(getRun('run_x')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('rejects a snapshot with an unknown status with INVALID_RESPONSE', async () => {
    restore = installMockAdapter({ status: 200, data: { ...sampleSnapshot, status: 'paused' } }).restore
    await expect(getRun(RUN_ID)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})
