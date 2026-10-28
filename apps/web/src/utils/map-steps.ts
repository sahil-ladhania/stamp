/**
 * File: map-steps.ts
 * Purpose: Maps wire steps to UI steps. The detail and the effort stay claims, so each keeps its own label.
 * Exports: mapSteps
 * Used by: utils/map-guide.ts
 */
import type { Step as WireStep } from '@stamp/schema'
import type { Step } from '@/types/guide-model'
import { mapClaim } from './map-claim'

export function mapSteps(steps: readonly WireStep[]): Step[] {
  return steps.map((step) => ({
    id: step.id,
    title: step.title,
    actor: step.actor,
    effort: mapClaim(step.effort),
    detail: mapClaim(step.detail),
  }))
}
