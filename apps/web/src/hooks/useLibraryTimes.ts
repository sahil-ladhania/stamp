/**
 * File: useLibraryTimes.ts
 * Purpose: Loads the first-test and production durations for the library rows. The list endpoint has no times, so it reads each
 *          full guide (read only) and keeps the durations the guide states. A guide that fails to load has no times, and the row
 *          shows them as not stated; the rest of the table does not wait on it.
 * Exports: useLibraryTimes
 * Used by: components/app-home/LibrarySection.tsx
 */
import { getGuide } from '@/services/guides.service'
import { libraryTimes, type LibraryTimes } from '@/utils/library-times'
import { useAsyncData } from './useAsyncData'

export type LibraryTimesBySlug = Record<string, LibraryTimes | null>

const SEPARATOR = '|'

// Module level, so its identity is stable for the effect inside useAsyncData.
async function loadLibraryTimes(key: string, signal: AbortSignal): Promise<LibraryTimesBySlug> {
  const slugs = key.split(SEPARATOR)
  const results = await Promise.allSettled(slugs.map((slug) => getGuide(slug, signal)))
  return Object.fromEntries(
    slugs.map((slug, index) => {
      const result = results[index]
      return [slug, result?.status === 'fulfilled' ? libraryTimes(result.value) : null]
    }),
  )
}

/** Pass the slugs of the rows. An empty list loads nothing. */
export function useLibraryTimes(slugs: readonly string[]): { times: LibraryTimesBySlug | null; isLoading: boolean } {
  const key = slugs.length > 0 ? [...slugs].sort().join(SEPARATOR) : null
  const { data, isLoading } = useAsyncData(key, loadLibraryTimes)
  return { times: data, isLoading }
}
