/**
 * File: run-destination.ts
 * Purpose: Where a start-run result sends the visitor: a cached guide, or the live run page.
 * Exports: getRunDestination
 * Used by: hooks/useStartRun.ts
 */
import type { StartRunResult } from '@stamp/schema'

/** `cached` opens the guide; `started` and `running` open the run. The typed name rides along as `?app=` for the heading. */
export function getRunDestination(result: StartRunResult, app: string): string {
  if (result.status === 'cached') return `/g/${encodeURIComponent(result.slug)}`
  return `/run/${encodeURIComponent(result.runId)}?app=${encodeURIComponent(app)}`
}
