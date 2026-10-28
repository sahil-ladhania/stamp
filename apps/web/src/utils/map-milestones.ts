/**
 * File: map-milestones.ts
 * Purpose: Maps the wire milestones (two named pairs) to the two milestones the UI lists in order.
 * Exports: mapMilestones
 * Used by: utils/map-guide.ts
 */
import type { Milestones } from '@stamp/schema'
import type { Milestone } from '@/types/guide-model'
import { mapClaim } from './map-claim'

export function mapMilestones(milestones: Milestones): [Milestone, Milestone] {
  return [
    {
      id: 'firstTest',
      title: 'First test connection',
      effort: mapClaim(milestones.firstTest.effort),
      wait: mapClaim(milestones.firstTest.wait),
    },
    {
      id: 'production',
      title: 'Production',
      effort: mapClaim(milestones.production.effort),
      wait: mapClaim(milestones.production.wait),
    },
  ]
}
