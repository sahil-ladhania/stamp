/**
 * File: guide-fixtures.ts
 * Purpose: Test guides built from the sample guide: change a few fields and the result is parsed with GuideSchema,
 *          so every variant is a valid wire guide. Includes a conflict, a partial guide and an empty one.
 * Exports: guideWith, conflictGuide, partialGuide, emptyPartialGuide
 * Used by: utils/map-*.test.ts, utils/collect-sources.test.ts, utils/uncertain-sections.test.ts
 */
import { GuideSchema, type Guide } from '@stamp/schema'
import { sampleGuide, sourcedClaim, unknownClaim } from './sample-data'

/** The sample guide with some fields replaced. Throws if the result is not a valid wire guide. */
export function guideWith(overrides: Partial<Guide>): Guide {
  return GuideSchema.parse({ ...sampleGuide, ...overrides })
}

const OFFICIAL = {
  url: 'https://docs.example.com/oauth',
  quote: 'Use the v3 callback path.',
  tier: 'official',
} as const
const FORUM = {
  url: 'https://forum.example.org/t/1',
  quote: 'Use the v3.1 callback path.',
  tier: 'forum',
} as const

/** One conflict between an official page and a forum post; the official page is preferred. */
export const conflictGuide: Guide = guideWith({
  conflicts: [
    {
      id: 'conflicts.0',
      topic: 'Callback path',
      sourceA: FORUM,
      sourceB: OFFICIAL,
      preferredUrl: OFFICIAL.url,
      reason: sourcedClaim('conflicts.0.reason'),
    },
  ],
})

/** A partial guide: blocker claims are all unknown and no conflict check ran. */
export const partialGuide: Guide = guideWith({
  coverage: 'partial',
  blockers: [
    {
      id: 'blockers.0',
      symptom: unknownClaim('blockers.0.symptom'),
      cause: unknownClaim('blockers.0.cause'),
      fix: unknownClaim('blockers.0.fix'),
      contact: null,
    },
  ],
})

/** A partial guide with nothing in Steps or Blockers. */
export const emptyPartialGuide: Guide = guideWith({ coverage: 'partial', steps: [], blockers: [] })
