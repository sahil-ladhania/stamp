/**
 * File: map-conflicts.ts
 * Purpose: Maps wire conflicts (two sources and a preferred URL) to UI conflicts with two options. The trusted
 *          option is the one whose URL is the preferred one; if neither matches, Stamp trusts neither.
 * Exports: mapConflicts
 * Used by: utils/map-guide.ts
 */
import type { Conflict as WireConflict } from '@stamp/schema'
import type { Conflict } from '@/types/guide-model'
import { mapClaim } from './map-claim'
import { mapSource } from './map-source'

export function mapConflicts(conflicts: readonly WireConflict[]): Conflict[] {
  return conflicts.map((conflict) => ({
    id: conflict.id,
    topic: conflict.topic,
    options: [
      { source: mapSource(conflict.sourceA), isTrusted: conflict.sourceA.url === conflict.preferredUrl },
      { source: mapSource(conflict.sourceB), isTrusted: conflict.sourceB.url === conflict.preferredUrl },
    ],
    reason: mapClaim(conflict.reason),
  }))
}
