/**
 * File: guide-claims.ts
 * Purpose: Lists every claim in a wire guide, in page order. The counts, the sources and the Uncertain
 *          sections all start from this one list.
 * Exports: listGuideClaims
 * Used by: utils/collect-sources.ts, utils/map-guide.ts
 */
import type { Claim, Guide } from '@stamp/schema'

export function listGuideClaims(guide: Guide): Claim[] {
  const { verdict, milestones } = guide
  return [
    verdict.summary,
    milestones.firstTest.effort,
    milestones.firstTest.wait,
    milestones.production.effort,
    milestones.production.wait,
    ...guide.requirements,
    ...guide.scopes.map((scope) => scope.reason),
    ...guide.steps.flatMap((step) => [step.detail, step.effort]),
    ...guide.blockers.flatMap((blocker) =>
      blocker.contact
        ? [blocker.symptom, blocker.cause, blocker.fix, blocker.contact]
        : [blocker.symptom, blocker.cause, blocker.fix],
    ),
    ...guide.limits,
    ...guide.conflicts.map((conflict) => conflict.reason),
  ]
}
