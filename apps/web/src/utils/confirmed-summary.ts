/**
 * File: confirmed-summary.ts
 * Purpose: The one-line verification summary for a guide ("20 of 39 claims confirmed"). Confirmed means Tested or Sourced:
 *          the opposite of the label Uncertain, whose meaning is "Not confirmed".
 * Exports: ConfirmedSummary, confirmedSummary
 * Used by: components/guide/GuideHeader.tsx
 */
import type { Claim } from '@/types/guide-model'
import { countByLabel } from './claims'

export type ConfirmedSummary = { confirmed: number; total: number; text: string }

export function confirmedSummary(claims: readonly Claim[]): ConfirmedSummary {
  const counts = countByLabel(claims)
  const confirmed = counts.tested + counts.sourced
  const total = claims.length
  return { confirmed, total, text: `${confirmed} of ${total} ${total === 1 ? 'claim' : 'claims'} confirmed` }
}
