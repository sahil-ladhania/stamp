/**
 * File: section-uncertainty.ts
 * Purpose: Which sections of a guide are mostly Uncertain, for the marker in the section navigation. "Mostly" means more
 *          than half of the section's content claims. An empty section counts, since it shows Uncertain notes only.
 * Exports: isMostlyUncertain, sectionUncertainty
 * Used by: components/guide/guide-sections.ts
 */
import type { Claim, Guide } from '@/types/guide-model'

export function isMostlyUncertain(claims: readonly Claim[]): boolean {
  if (claims.length === 0) return true
  return claims.filter((claim) => claim.label === 'uncertain').length * 2 > claims.length
}

export type SectionUncertainty = {
  timeline: boolean
  steps: boolean
  requirements: boolean
  blockers: boolean
}

/** Steps count their details (the effort of a step is always Uncertain); blockers their symptom, cause and fix. */
export function sectionUncertainty(guide: Guide): SectionUncertainty {
  const [firstTest, production] = guide.milestones
  return {
    timeline: isMostlyUncertain([firstTest.effort, firstTest.wait, production.effort, production.wait]),
    steps: isMostlyUncertain(guide.steps.map((step) => step.detail)),
    requirements: isMostlyUncertain([
      ...guide.requirements,
      ...guide.scopes.map((scope) => scope.reason),
      ...guide.limits,
    ]),
    blockers: isMostlyUncertain(guide.blockers.flatMap((blocker) => [blocker.symptom, blocker.cause, blocker.fix])),
  }
}
