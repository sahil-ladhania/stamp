/**
 * File: run-elapsed.ts
 * Purpose: How long a run has taken: from its start to its finish, or to now while it is still running.
 * Exports: computeElapsedMs
 * Used by: hooks/useRunClock.ts
 */

type ElapsedInput = {
  startedAt: string
  /** Null while the run is live. */
  finishedAt: string | null
  now: number
}

/** Never negative: the browser clock can sit a little behind the server's `startedAt`. */
export function computeElapsedMs({ startedAt, finishedAt, now }: ElapsedInput): number {
  const start = Date.parse(startedAt)
  if (Number.isNaN(start)) return 0
  const end = finishedAt === null ? now : Date.parse(finishedAt)
  if (Number.isNaN(end)) return 0
  return Math.max(0, end - start)
}
