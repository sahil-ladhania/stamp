/**
 * File: health.service.test.ts
 * Purpose: Tests getHealth: the URL, the plain-text reply and the failures.
 * Exports: none
 * Used by: vitest
 */
import { afterEach, describe, expect, it } from 'vitest'
import { installMockAdapter } from '@/test-support/mock-adapter'
import { getHealth } from './health.service'

let restore: () => void = () => {}
afterEach(() => restore())

describe('getHealth', () => {
  it('gets /api/health and accepts the plain-text reply', async () => {
    const mock = installMockAdapter({ status: 200, data: 'Server is running...' })
    restore = mock.restore
    await expect(getHealth()).resolves.toEqual({ status: 'ok' })
    expect(mock.calls).toMatchObject([{ method: 'get', url: '/api/health' }])
  })

  it('rejects an empty reply with INVALID_RESPONSE', async () => {
    restore = installMockAdapter({ status: 200, data: '' }).restore
    await expect(getHealth()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('rejects a JSON reply with INVALID_RESPONSE, since the endpoint answers text', async () => {
    restore = installMockAdapter({ status: 200, data: { ok: true } }).restore
    await expect(getHealth()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('rejects with NETWORK when the API cannot be reached', async () => {
    restore = installMockAdapter({ failure: 'network' }).restore
    await expect(getHealth()).rejects.toMatchObject({ code: 'NETWORK' })
  })
})
