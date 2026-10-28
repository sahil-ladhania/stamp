/**
 * File: api-client.test.ts
 * Purpose: Tests the shared Axios instance: its defaults, and that the interceptor hands back ApiError, never a raw Axios error.
 * Exports: none
 * Used by: vitest
 */
import axios from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { installMockAdapter } from '@/test-support/mock-adapter'
import { isApiError } from './api-error'
import { apiClient, REQUEST_TIMEOUT_MS } from './api-client'

let restore: () => void = () => {}
afterEach(() => restore())

describe('apiClient', () => {
  it('sends JSON headers and a timeout, with no base URL in dev', async () => {
    const mock = installMockAdapter({ status: 200, data: {} })
    restore = mock.restore
    await apiClient.post('/api/runs', { app: 'Notion' })
    const [call] = mock.calls
    expect(call?.timeout).toBe(REQUEST_TIMEOUT_MS)
    expect(call?.baseURL).toBe('')
    expect(call?.headers['Content-Type']).toBe('application/json')
    expect(call?.headers['Accept']).toBe('application/json')
  })

  it('sends no custom header, which the API CORS policy would block', async () => {
    const mock = installMockAdapter({ status: 200, data: {} })
    restore = mock.restore
    await apiClient.post('/api/runs', { app: 'Notion' })
    const names = Object.keys(mock.calls[0]?.headers ?? {}).map((name) => name.toLowerCase())
    expect(names.filter((name) => !['accept', 'content-type'].includes(name))).toEqual([])
  })

  it('rejects an API error body with an ApiError', async () => {
    const mock = installMockAdapter({
      status: 404,
      data: { error: { code: 'NOT_FOUND', message: 'Guide not found.' } },
    })
    restore = mock.restore
    const error = await apiClient.get('/api/guides/x').catch((caught: unknown) => caught)
    expect(isApiError(error)).toBe(true)
    expect(error).toMatchObject({ code: 'NOT_FOUND', status: 404, message: 'Guide not found.' })
  })

  it('rejects a network failure with an ApiError, not an AxiosError', async () => {
    const mock = installMockAdapter({ failure: 'network' })
    restore = mock.restore
    const error = await apiClient.get('/api/guides').catch((caught: unknown) => caught)
    expect(isApiError(error)).toBe(true)
    expect(axios.isAxiosError(error)).toBe(false)
    expect(error).toMatchObject({ code: 'NETWORK' })
  })

  it('rejects a timeout with NETWORK', async () => {
    const mock = installMockAdapter({ failure: 'timeout' })
    restore = mock.restore
    const error = await apiClient.get('/api/guides').catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: 'NETWORK' })
  })

  it('lets a cancelled request through untouched, so a hook can ignore its own abort', async () => {
    const mock = installMockAdapter({ failure: 'cancel' })
    restore = mock.restore
    const error = await apiClient.get('/api/guides').catch((caught: unknown) => caught)
    expect(axios.isCancel(error)).toBe(true)
    expect(isApiError(error)).toBe(false)
  })
})
