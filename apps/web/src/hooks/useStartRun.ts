/**
 * File: useStartRun.ts
 * Purpose: The one start-run flow: POST /api/runs, then open the cached guide or the live run page.
 * Exports: useStartRun
 * Used by: every search box (Landing, App home, Not found) and the Live run page's retry and "Did you mean" options
 */
import { useNavigate } from 'react-router'
import type { ApiError } from '@/lib/api-error'
import { createRun } from '@/services/runs.service'
import { getRunDestination } from '@/utils/run-destination'
import { useAsyncAction } from './useAsyncAction'

type UseStartRunResult = {
  /** `force` skips the cache and researches again (the Refresh and Retry buttons). */
  start: (app: string, options?: { force?: boolean }) => Promise<void>
  isPending: boolean
  error: ApiError | null
  reset: () => void
}

export function useStartRun(): UseStartRunResult {
  const navigate = useNavigate()
  const { run, isPending, error, reset } = useAsyncAction(createRun)

  async function start(app: string, options: { force?: boolean } = {}): Promise<void> {
    const result = await run({ app, ...(options.force ? { force: true } : {}) })
    if (result) navigate(getRunDestination(result, app))
  }

  return { start, isPending, error, reset }
}
