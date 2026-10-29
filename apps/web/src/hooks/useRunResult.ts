/**
 * File: useRunResult.ts
 * Purpose: Loads the saved guide of a finished run, for the result card and the app name. Pass null until the run is done. A guide
 *          that fails to load is not an error for the page: the card falls back to the run's own numbers.
 * Exports: useRunResult
 * Used by: components/run/RunScreen.tsx
 */
import type { Guide } from '@/types/guide-model'
import { mapGuide } from '@/utils/map-guide'
import { useGuide } from './useGuide'

export function useRunResult(slug: string | null): { guide: Guide | null; isLoading: boolean } {
  const { data, isLoading } = useGuide(slug)
  return { guide: data ? mapGuide(data) : null, isLoading: slug !== null && isLoading }
}
