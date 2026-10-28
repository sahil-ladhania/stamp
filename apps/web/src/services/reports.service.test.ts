/**
 * File: reports.service.test.ts
 * Purpose: Tests reportClaim: the URL and body, the report id, and the error replies.
 * Exports: none
 * Used by: vitest
 */
import { afterEach, describe, expect, it } from 'vitest'
import { installMockAdapter } from '@/test-support/mock-adapter'
import { reportClaim } from './reports.service'

let restore: () => void = () => {}
afterEach(() => restore())

describe('reportClaim', () => {
  it('posts the claim and note to /api/guides/:slug/reports and returns the report id', async () => {
    const mock = installMockAdapter({ status: 201, data: { reportId: 'rep_1' } })
    restore = mock.restore
    const input = { claimId: 'steps.5', note: 'Callback path is v3.1 now' }
    await expect(reportClaim('hubspot', input)).resolves.toEqual({ reportId: 'rep_1' })
    expect(mock.calls).toMatchObject([
      { method: 'post', url: '/api/guides/hubspot/reports', body: input },
    ])
  })

  it('sends only the claim id when there is no note', async () => {
    const mock = installMockAdapter({ status: 201, data: { reportId: 'rep_2' } })
    restore = mock.restore
    await reportClaim('hubspot', { claimId: 'steps.5' })
    expect(mock.calls[0]?.body).toEqual({ claimId: 'steps.5' })
  })

  it('rejects a claim the guide does not contain with VALIDATION_ERROR', async () => {
    restore = installMockAdapter({
      status: 400,
      data: { error: { code: 'VALIDATION_ERROR', message: 'claimId: no such claim in this guide.' } },
    }).restore
    await expect(reportClaim('hubspot', { claimId: 'steps.99' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })
  })

  it('rejects a guide that does not exist with NOT_FOUND', async () => {
    restore = installMockAdapter({
      status: 404,
      data: { error: { code: 'NOT_FOUND', message: 'Guide not found.' } },
    }).restore
    await expect(reportClaim('nope', { claimId: 'steps.1' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('rejects a 429 with RATE_LIMITED and the wait', async () => {
    restore = installMockAdapter({
      status: 429,
      data: { error: { code: 'RATE_LIMITED', message: 'Too many reports. Try again in a minute.' } },
      headers: { 'retry-after': '30' },
    }).restore
    await expect(reportClaim('hubspot', { claimId: 'steps.1' })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      retryAfter: 30,
    })
  })

  it('rejects a reply without a report id with INVALID_RESPONSE', async () => {
    restore = installMockAdapter({ status: 201, data: {} }).restore
    await expect(reportClaim('hubspot', { claimId: 'steps.1' })).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
  })
})
