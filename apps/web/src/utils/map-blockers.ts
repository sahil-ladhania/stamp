/**
 * File: map-blockers.ts
 * Purpose: Maps wire blockers to UI blockers. The wire blocker has no title, so it is a short complete phrase from the symptom:
 *          the first sentence, cut at a clause break so it never ends mid-word.
 * Exports: UNCONFIRMED_BLOCKER_TITLE, blockerTitle, mapBlockers
 * Used by: utils/map-guide.ts
 */
import type { Blocker as WireBlocker, Claim as WireClaim } from '@stamp/schema'
import type { Blocker } from '@/types/guide-model'
import { clauseTitle } from './clamp-words'
import { mapClaim } from './map-claim'

export const UNCONFIRMED_BLOCKER_TITLE = 'Unconfirmed blocker'
const MAX_TITLE_LENGTH = 90

/** A symptom with nothing behind it is an unknown, not a sentence to quote as a title. */
export function blockerTitle(symptom: WireClaim): string {
  if (symptom.label === 'uncertain' && symptom.sources.length === 0) {
    return UNCONFIRMED_BLOCKER_TITLE
  }
  const title = clauseTitle(symptom.text, MAX_TITLE_LENGTH)
  return title === '' ? UNCONFIRMED_BLOCKER_TITLE : title
}

export function mapBlockers(blockers: readonly WireBlocker[]): Blocker[] {
  return blockers.map((blocker) => ({
    id: blocker.id,
    title: blockerTitle(blocker.symptom),
    symptom: mapClaim(blocker.symptom),
    cause: mapClaim(blocker.cause),
    fix: mapClaim(blocker.fix),
    contact: blocker.contact ? mapClaim(blocker.contact) : null,
  }))
}
