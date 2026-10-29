/**
 * File: claim-summary.ts
 * Purpose: The one-line summary of a guide's claims ("11 of 24 claims sourced"). Only Tested means confirmed, so a Sourced
 *          claim is never called confirmed: the line says "sourced", and names the tested ones when there are any.
 * Exports: ClaimSummary, claimSummary
 * Used by: components/guide/GuideHeader.tsx, components/guide/VerificationBar.tsx
 */
import type { Claim } from '@/types/guide-model'
import { countByLabel } from './claims'
import { pluralize } from './plural'

export type ClaimSummary = { tested: number; sourced: number; total: number; text: string }

export function claimSummary(claims: readonly Claim[]): ClaimSummary {
  const counts = countByLabel(claims)
  const total = claims.length
  const { tested, sourced } = counts
  const text =
    tested === 0
      ? `${sourced} of ${pluralize(total, 'claim')} sourced`
      : `${tested} tested, ${sourced} sourced of ${pluralize(total, 'claim')}`
  return { tested, sourced, total, text }
}
