/**
 * File: milestone-durations.ts
 * Purpose: The durations a guide's milestones state, for the timeline chips. A duration is read from the claim text; when
 *          the text states none, the value is null. The first test also reads its "waits on" claim, where real guides
 *          sometimes put it.
 * Exports: MilestoneDurations, milestoneDurations
 * Used by: utils/verdict.ts, components/guide/TimelineSection.tsx
 */
import type { Milestone } from '@/types/guide-model'
import { extractDuration } from './extract-duration'

export type MilestoneDurations = {
  firstTest: string | null
  approvalWait: string | null
  production: string | null
}

export function milestoneDurations([firstTest, production]: readonly [Milestone, Milestone]): MilestoneDurations {
  return {
    firstTest: extractDuration(firstTest.effort.text) ?? extractDuration(firstTest.wait.text),
    approvalWait: extractDuration(production.wait.text),
    production: extractDuration(production.effort.text),
  }
}
