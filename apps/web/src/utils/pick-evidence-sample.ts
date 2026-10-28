/**
 * File: pick-evidence-sample.ts
 * Purpose: Picks one real Sourced or Tested claim, with a quoted source, for the Landing page's evidence example.
 * Exports: pickEvidenceSample
 * Used by: components/landing/EvidenceSection.tsx
 */
import type { Claim, Guide } from '@/types/guide-model'

/** The first claim in page order that is confirmed and has a quote to show. Null when the guide has none. */
export function pickEvidenceSample(guide: Guide): Claim | null {
  return (
    guide.claims.find(
      (claim) => claim.label !== 'uncertain' && claim.sources.some((source) => source.quote),
    ) ?? null
  )
}
