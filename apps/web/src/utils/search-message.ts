/**
 * File: search-message.ts
 * Purpose: The line shown under a search box while a run starts, or after it failed.
 * Exports: getSearchMessage
 * Used by: components/shared/StartRunSearch.tsx
 */
import type { ApiError } from '@/lib/api-error'
import { getApiErrorMessage } from './error-messages'

type SearchState = { isPending: boolean; app: string; error: ApiError | null }

/** Null means nothing to say. The run cap has its own notice, so it adds no line here. */
export function getSearchMessage({ isPending, app, error }: SearchState): string | null {
  if (isPending) return `Looking up ${app}`
  if (!error || error.code === 'RUN_CAP_REACHED') return null
  return getApiErrorMessage(error)
}
