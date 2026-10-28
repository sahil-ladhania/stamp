/**
 * File: useAsyncData.ts
 * Purpose: The shared async-state helper for every data hook: loads on mount and when the key changes, aborts
 *          on cleanup, and returns `{ data, error, isLoading, reload }`.
 * Exports: UseAsyncDataResult, useAsyncData
 * Used by: hooks/useGuides.ts, hooks/useGuide.ts
 */
import { useEffect, useState } from 'react'
import type { ApiError } from '@/lib/api-error'
import { toApiError } from '@/lib/to-api-error'

export type UseAsyncDataResult<T> = {
  data: T | null
  error: ApiError | null
  isLoading: boolean
  /** Loads again, for a Retry button. */
  reload: () => void
}

type Settled<K, T> = { key: K; attempt: number } & (
  | { data: T; error: null }
  | { data: null; error: ApiError }
)

/**
 * `key` is what is loaded (a slug, say); null means nothing to load yet. `load` must be a stable function
 * (declared at module level), since it is a dependency of the effect. A result that belongs to an older key
 * is ignored, so a changed key shows loading at once and never a stale value.
 */
export function useAsyncData<K extends string, T>(
  key: K | null,
  load: (key: K, signal: AbortSignal) => Promise<T>,
): UseAsyncDataResult<T> {
  const [settled, setSettled] = useState<Settled<K, T> | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (key === null) return
    const controller = new AbortController()
    load(key, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setSettled({ key, attempt, data, error: null })
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setSettled({ key, attempt, data: null, error: toApiError(error) })
        }
      },
    )
    return () => controller.abort()
  }, [key, attempt, load])

  const isCurrent = settled !== null && settled.key === key && settled.attempt === attempt
  return {
    data: isCurrent ? settled.data : null,
    error: isCurrent ? settled.error : null,
    isLoading: key !== null && !isCurrent,
    reload: () => setAttempt((count) => count + 1),
  }
}
