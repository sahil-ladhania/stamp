/**
 * File: useGuide.ts
 * Purpose: Loads one guide by slug. An unknown slug comes back as an ApiError with code NOT_FOUND.
 * Exports: useGuide
 * Used by: Guide page, Landing page
 */
import type { Guide } from '@stamp/schema'
import { getGuide } from '@/services/guides.service'
import { useAsyncData, type UseAsyncDataResult } from './useAsyncData'

/** Pass null to wait (no request is made). */
export function useGuide(slug: string | null): UseAsyncDataResult<Guide> {
  return useAsyncData(slug, getGuide)
}
