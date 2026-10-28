/**
 * File: claim-helpers.ts
 * Purpose: Small builders so mock guides stay short. Labels are set here by hand: mock data
 *          marks a claim Sourced only when the docs name its source page, Uncertain otherwise.
 * Exports: NO_SOURCE_REASON, TIME_UNTESTED_REASON, sourcedClaim, uncertainClaim
 * Used by: mocks/guides/*.ts
 */
import type { Claim, Source } from './types'

export const NO_SOURCE_REASON = 'No source page found'
export const TIME_UNTESTED_REASON = 'Time estimates stay Uncertain until tested'

/** A claim whose source page is named in the docs. */
export function sourcedClaim(id: string, text: string, sources: readonly Source[]): Claim {
  return { id, text, label: 'sourced', sources: [...sources] }
}

/** A claim that is not confirmed; `sources` may hold leads that do not confirm it. */
export function uncertainClaim(id: string, text: string, reason: string, sources: readonly Source[] = []): Claim {
  return { id, text, label: 'uncertain', sources: [...sources], reason }
}
