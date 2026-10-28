/**
 * File: health.service.ts
 * Purpose: GET /api/health. The endpoint answers plain text, so only "a non-empty reply" is checked.
 * Exports: getHealth
 * Used by: hooks and dev checks that need a liveness probe
 */
import { ApiError } from '@/lib/api-error'
import { apiClient } from '@/lib/api-client'

/** Resolves when the API is up; rejects with an ApiError when it is not or replies with nothing. */
export async function getHealth(signal?: AbortSignal): Promise<{ status: 'ok' }> {
  const { data } = await apiClient.get<unknown>('/api/health', { signal })
  if (typeof data !== 'string' || data.trim() === '') {
    throw new ApiError('INVALID_RESPONSE', 'The health check did not reply with text.')
  }
  return { status: 'ok' }
}
