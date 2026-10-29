/**
 * File: library-times.ts
 * Purpose: The first-test and production durations a library row shows, read from a full guide. A time estimate is
 *          always Uncertain until tested, so the label travels with the duration and the UI never drops it.
 * Exports: LibraryTime, LibraryTimes, libraryTimes
 * Used by: hooks/useLibraryTimes.ts, components/app-home/LibraryTable.tsx
 */
import type { Claim, EvidenceLabel, Guide } from '@stamp/schema'
import { extractDuration } from './extract-duration'

export type LibraryTime = { duration: string; label: EvidenceLabel }
export type LibraryTimes = { firstTest: LibraryTime | null; production: LibraryTime | null }

function firstStated(claims: readonly Claim[]): LibraryTime | null {
  for (const claim of claims) {
    const duration = extractDuration(claim.text)
    if (duration) return { duration, label: claim.label }
  }
  return null
}

/** The first test also reads its "waits on" claim; production reads its effort only (its wait is the approval wait). */
export function libraryTimes(guide: Guide): LibraryTimes {
  const { firstTest, production } = guide.milestones
  return {
    firstTest: firstStated([firstTest.effort, firstTest.wait]),
    production: firstStated([production.effort]),
  }
}
