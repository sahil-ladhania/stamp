/**
 * File: useGuides.ts
 * Purpose: Loads the library list for the home pages. An empty list is a valid result, not an error.
 * Exports: useGuides
 * Used by: App home and Landing pages
 */
import type { GuideSummary } from '@stamp/schema'
import { listGuides } from '@/services/guides.service'
import { useAsyncData, type UseAsyncDataResult } from './useAsyncData'

const LIBRARY_KEY = 'library'

// Module level, so its identity is stable for the effect inside useAsyncData.
function loadLibrary(_key: typeof LIBRARY_KEY, signal: AbortSignal): Promise<GuideSummary[]> {
  return listGuides(signal)
}

export function useGuides(): UseAsyncDataResult<GuideSummary[]> {
  return useAsyncData(LIBRARY_KEY, loadLibrary)
}
