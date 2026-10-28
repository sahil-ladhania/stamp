/**
 * File: reports.service.ts
 * Purpose: POST /api/guides/:slug/reports, which flags a claim as wrong.
 * Exports: reportClaim
 * Used by: hooks/useReportClaim.ts
 */
import {
  CreateClaimReportResultSchema,
  type CreateClaimReportInput,
  type CreateClaimReportResult,
} from '@stamp/schema'
import { apiClient } from '@/lib/api-client'
import { parseResponse } from '@/lib/parse-response'

/** Resolves with the report id. A claim the guide does not contain rejects with VALIDATION_ERROR. */
export async function reportClaim(
  slug: string,
  input: CreateClaimReportInput,
  signal?: AbortSignal,
): Promise<CreateClaimReportResult> {
  const { data } = await apiClient.post<unknown>(
    `/api/guides/${encodeURIComponent(slug)}/reports`,
    input,
    { signal },
  )
  return parseResponse(CreateClaimReportResultSchema, data)
}
