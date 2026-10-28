/**
 * File: uncertain-sections.ts
 * Purpose: Which sections of a guide are Uncertain, computed from the claim labels. A section is Uncertain when every
 *          claim that fills it is Uncertain. An empty section is Uncertain only on a partial guide, where
 *          "nothing found" and "not reached" look the same.
 * Exports: GUIDE_SECTION, computeUncertainSections
 * Used by: utils/map-guide.ts, components/guide/GuideView.tsx
 */
import type { Claim, Guide } from '@stamp/schema'

/** The section names a partial guide lists. */
export const GUIDE_SECTION = {
  steps: 'Steps',
  blockers: 'Blockers',
  conflicts: 'Source conflicts',
} as const

function isUncertain(claims: readonly Claim[]): boolean {
  return claims.every((claim) => claim.label === 'uncertain')
}

/** Each item is the claims that carry its content. The effort of a step is left out: time estimates are always Uncertain. */
function isSectionUncertain(items: readonly (readonly Claim[])[], isPartial: boolean): boolean {
  if (items.length === 0) return isPartial
  return items.every(isUncertain)
}

export function computeUncertainSections(guide: Guide): string[] {
  const isPartial = guide.coverage === 'partial'
  const sections: string[] = []
  if (isSectionUncertain(guide.steps.map((step) => [step.detail]), isPartial)) {
    sections.push(GUIDE_SECTION.steps)
  }
  const blockerClaims = guide.blockers.map((blocker) => [blocker.symptom, blocker.cause, blocker.fix])
  if (isSectionUncertain(blockerClaims, isPartial)) sections.push(GUIDE_SECTION.blockers)
  // Conflicts that exist are findings. Only a partial run with none found cannot say whether it checked.
  if (guide.conflicts.length === 0 && isPartial) sections.push(GUIDE_SECTION.conflicts)
  return sections
}
