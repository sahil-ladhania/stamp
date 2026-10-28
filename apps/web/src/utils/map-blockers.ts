/**
 * File: map-blockers.ts
 * Purpose: Maps wire blockers to UI blockers. The wire blocker has no title, so it is the first sentence of the symptom.
 * Exports: UNCONFIRMED_BLOCKER_TITLE, blockerTitle, mapBlockers
 * Used by: utils/map-guide.ts
 */
import type { Blocker as WireBlocker, Claim as WireClaim } from '@stamp/schema'
import type { Blocker } from '@/types/guide-model'
import { mapClaim } from './map-claim'

export const UNCONFIRMED_BLOCKER_TITLE = 'Unconfirmed blocker'
const MAX_TITLE_LENGTH = 80

/** A symptom with nothing behind it is an unknown, not a sentence to quote as a title. */
export function blockerTitle(symptom: WireClaim): string {
  if (symptom.label === 'uncertain' && symptom.sources.length === 0) {
    return UNCONFIRMED_BLOCKER_TITLE
  }
  const firstSentence = symptom.text.trim().split(/(?<=[.!?])\s/)[0] ?? ''
  const title = firstSentence.replace(/[.!?]+$/, '')
  if (title === '') return UNCONFIRMED_BLOCKER_TITLE
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1)}…` : title
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
