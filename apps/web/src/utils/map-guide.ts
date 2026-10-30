/**
 * File: map-guide.ts
 * Purpose: Maps a guide from @stamp/schema to the shape the guide components render. Composes one mapper per
 *          mismatch; it sets no label and invents no fact.
 * Exports: mapGuide
 * Used by: pages/GuidePage.tsx, pages/LandingPage.tsx
 */
import type { Guide as WireGuide } from '@stamp/schema'
import type { Guide } from '@/types/guide-model'
import { collectSources } from './collect-sources'
import { listGuideClaims } from './guide-claims'
import { mapBlockers } from './map-blockers'
import { mapClaim } from './map-claim'
import { mapConflicts } from './map-conflicts'
import { mapDifficulty } from './map-difficulty'
import { mapMilestones } from './map-milestones'
import { mapSteps } from './map-steps'
import { computeUncertainSections } from './uncertain-sections'

export function mapGuide(guide: WireGuide): Guide {
  const summary = mapClaim(guide.verdict.summary)
  return {
    slug: guide.slug,
    appName: guide.appName,
    domain: guide.domain,
    product: guide.product ?? null,
    archetype: guide.archetype,
    mode: guide.mode,
    coverage: guide.coverage,
    asOf: guide.asOf,
    headline: summary.text,
    summary,
    difficulty: mapDifficulty(guide),
    milestones: mapMilestones(guide.milestones),
    nextStepId: guide.verdict.nextStepId,
    topBlockerId: guide.verdict.topBlockerId,
    requirements: guide.requirements.map(mapClaim),
    scopes: guide.scopes.map((scope) => ({ id: scope.id, name: scope.name, reason: mapClaim(scope.reason) })),
    limits: guide.limits.map(mapClaim),
    steps: mapSteps(guide.steps),
    blockers: mapBlockers(guide.blockers),
    conflicts: mapConflicts(guide.conflicts),
    sources: collectSources(guide),
    claims: listGuideClaims(guide).map(mapClaim),
    uncertainSections: computeUncertainSections(guide),
  }
}
