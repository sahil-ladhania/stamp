/**
 * File: guides.service.test.ts
 * Purpose: Tests the guide services: URL, method, validation and errors.
 * Exports: none
 * Used by: vitest
 */
import { afterEach, describe, expect, it } from 'vitest'
import { installMockAdapter } from '@/test-support/mock-adapter'
import { sampleGuide, sampleSummary } from '@/test-support/sample-data'
import { getGuide, listGuides } from './guides.service'

let restore: () => void = () => {}
afterEach(() => restore())

describe('listGuides', () => {
  it('gets /api/guides and returns the validated list', async () => {
    const mock = installMockAdapter({ status: 200, data: [sampleSummary] })
    restore = mock.restore
    await expect(listGuides()).resolves.toEqual([sampleSummary])
    expect(mock.calls).toMatchObject([{ method: 'get', url: '/api/guides' }])
  })

  it('treats an empty library as a valid result', async () => {
    restore = installMockAdapter({ status: 200, data: [] }).restore
    await expect(listGuides()).resolves.toEqual([])
  })

  it('rejects a list that does not match the shared schema with INVALID_RESPONSE', async () => {
    restore = installMockAdapter({ status: 200, data: [{ ...sampleSummary, difficulty: 9 }] }).restore
    await expect(listGuides()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('rejects a reply that is not a list with INVALID_RESPONSE', async () => {
    restore = installMockAdapter({ status: 200, data: { guides: [] } }).restore
    await expect(listGuides()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})

describe('getGuide', () => {
  it('gets /api/guides/:slug and returns the validated guide', async () => {
    const mock = installMockAdapter({ status: 200, data: sampleGuide })
    restore = mock.restore
    await expect(getGuide('example')).resolves.toEqual(sampleGuide)
    expect(mock.calls).toMatchObject([{ method: 'get', url: '/api/guides/example' }])
  })

  it('encodes the slug in the path', async () => {
    const mock = installMockAdapter({ status: 200, data: sampleGuide })
    restore = mock.restore
    await getGuide('a b/c')
    expect(mock.calls[0]?.url).toBe('/api/guides/a%20b%2Fc')
  })

  it('rejects an unknown slug with NOT_FOUND', async () => {
    restore = installMockAdapter({
      status: 404,
      data: { error: { code: 'NOT_FOUND', message: 'Guide not found.' } },
    }).restore
    await expect(getGuide('nope')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })

  it('rejects a guide that does not match the shared schema with INVALID_RESPONSE', async () => {
    restore = installMockAdapter({ status: 200, data: { ...sampleGuide, difficulty: 0 } }).restore
    await expect(getGuide('example')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
})
