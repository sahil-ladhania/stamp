/**
 * File: useRunClock.ts
 * Purpose: The run's elapsed time for the budget strip. Ticks while the run is live and stops when it ends.
 * Exports: useRunClock
 * Used by: components/run/RunScreen.tsx
 */
import type { RunSnapshot } from '@stamp/schema'
import { useEffect, useState } from 'react'
import { computeElapsedMs } from '@/utils/run-elapsed'

const TICK_MS = 250

/** Zero until the snapshot arrives. A finished run replayed later uses the server's finish time. */
export function useRunClock(snapshot: RunSnapshot | null, isRunning: boolean): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isRunning) return
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [isRunning])

  if (!snapshot) return 0
  return computeElapsedMs({
    startedAt: snapshot.startedAt,
    finishedAt: isRunning ? null : snapshot.finishedAt,
    now,
  })
}
