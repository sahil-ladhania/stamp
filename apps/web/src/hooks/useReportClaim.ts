/**
 * File: useReportClaim.ts
 * Purpose: Flags a claim as wrong. `report` resolves with the report id, or null when it failed (see `error`).
 * Exports: useReportClaim
 * Used by: components/guide (the "Report wrong claim" control, added in Phase 2)
 */
import type { CreateClaimReportInput, CreateClaimReportResult } from '@stamp/schema'
import type { ApiError } from '@/lib/api-error'
import { reportClaim } from '@/services/reports.service'
import { useAsyncAction } from './useAsyncAction'

type UseReportClaimResult = {
  report: (
    slug: string,
    input: CreateClaimReportInput,
  ) => Promise<CreateClaimReportResult | null>
  isPending: boolean
  error: ApiError | null
  reset: () => void
}

export function useReportClaim(): UseReportClaimResult {
  const { run, isPending, error, reset } = useAsyncAction(reportClaim)
  return { report: run, isPending, error, reset }
}
