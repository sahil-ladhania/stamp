/**
 * File: useAsyncAction.ts
 * Purpose: The shared helper for actions the user triggers (start a run, report a claim): `run` calls the
 *          service once at a time and tracks `{ isPending, error }`.
 * Exports: UseAsyncActionResult, useAsyncAction
 * Used by: hooks/useStartRun.ts, hooks/useReportClaim.ts
 */
import { useRef, useState } from 'react'
import type { ApiError } from '@/lib/api-error'
import { toApiError } from '@/lib/to-api-error'

export type UseAsyncActionResult<A extends unknown[], R> = {
  /** Resolves with the result, or null when it failed (see `error`) or another call is still pending. */
  run: (...args: A) => Promise<R | null>
  isPending: boolean
  error: ApiError | null
  /** Clears the error, for example when the visitor edits the input again. */
  reset: () => void
}

export function useAsyncAction<A extends unknown[], R>(
  action: (...args: A) => Promise<R>,
): UseAsyncActionResult<A, R> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  // A ref, so a second click in the same tick is dropped before state has re-rendered.
  const isRunning = useRef(false)

  async function run(...args: A): Promise<R | null> {
    if (isRunning.current) return null
    isRunning.current = true
    setIsPending(true)
    setError(null)
    try {
      return await action(...args)
    } catch (caught) {
      setError(toApiError(caught))
      return null
    } finally {
      isRunning.current = false
      setIsPending(false)
    }
  }

  return { run, isPending, error, reset: () => setError(null) }
}
