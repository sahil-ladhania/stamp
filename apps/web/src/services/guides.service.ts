/**
 * File: guides.service.ts
 * Purpose: GET /api/guides (library list) and GET /api/guides/:slug (one guide), validated with the shared schemas.
 * Exports: listGuides, getGuide
 * Used by: hooks/useGuides.ts, hooks/useGuide.ts
 */
import { GuideSchema, GuideSummarySchema, type Guide, type GuideSummary } from '@stamp/schema'
import { apiClient } from '@/lib/api-client'
import { parseResponse } from '@/lib/parse-response'

const GuideSummaryListSchema = GuideSummarySchema.array()

/** Library guides only, easiest first, as the API returns them. */
export async function listGuides(signal?: AbortSignal): Promise<GuideSummary[]> {
  const { data } = await apiClient.get<unknown>('/api/guides', { signal })
  return parseResponse(GuideSummaryListSchema, data)
}

/** One guide by slug. An unknown slug rejects with ApiError code NOT_FOUND. */
export async function getGuide(slug: string, signal?: AbortSignal): Promise<Guide> {
  const { data } = await apiClient.get<unknown>(`/api/guides/${encodeURIComponent(slug)}`, {
    signal,
  })
  return parseResponse(GuideSchema, data)
}
