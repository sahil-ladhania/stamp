/**
 * File: sample-data.ts
 * Purpose: Test fixtures built from @stamp/schema: a valid Guide and library summary, a run snapshot, and a
 *          factory for each stream event. The guide is parsed at load, so a fixture that drifts from the schema fails fast.
 * Exports: RUN_ID, sourcedClaim, unknownClaim, sampleGuide, sampleSummary, sampleSnapshot, runEvent
 * Used by: services/*.test.ts, utils/*.test.ts
 */
import {
  GuideSchema,
  type Claim,
  type Guide,
  type GuideSummary,
  type RunSnapshot,
  type RunStreamEvent,
} from '@stamp/schema'

export const RUN_ID = 'run_1'

/** A Sourced claim with one official source whose quote is its own text. */
export function sourcedClaim(id: string): Claim {
  const text = `Text for ${id}`
  return { id, text, label: 'sourced', sources: [{ url: 'https://docs.example.com/oauth', quote: text, tier: 'official' }] }
}

/** The Uncertain claim, with no source, that stands in for an unknown fact. */
export function unknownClaim(id: string): Claim {
  return { id, text: 'Not found in the fetched sources.', label: 'uncertain', sources: [] }
}

export const sampleGuide: Guide = GuideSchema.parse({
  schemaVersion: 1,
  slug: 'example',
  appName: 'Example',
  domain: 'example.com',
  mode: 'live',
  archetype: 'hidden_limits',
  difficulty: 4,
  asOf: '2026-10-28T00:00:00.000Z',
  coverage: 'full',
  verdict: { summary: sourcedClaim('verdict.summary'), nextStepId: 'steps.0', topBlockerId: 'blockers.0' },
  milestones: {
    firstTest: { effort: unknownClaim('milestones.firstTest.effort'), wait: unknownClaim('milestones.firstTest.wait') },
    production: { effort: unknownClaim('milestones.production.effort'), wait: sourcedClaim('milestones.production.wait') },
  },
  requirements: [sourcedClaim('requirements.0')],
  scopes: [{ id: 'scopes.0', name: 'contacts.read', reason: sourcedClaim('scopes.0.reason') }],
  steps: [
    {
      id: 'steps.0',
      title: 'Create a developer account',
      detail: sourcedClaim('steps.0.detail'),
      actor: 'human',
      effort: unknownClaim('steps.0.effort'),
    },
  ],
  blockers: [
    {
      id: 'blockers.0',
      symptom: sourcedClaim('blockers.0.symptom'),
      cause: sourcedClaim('blockers.0.cause'),
      fix: unknownClaim('blockers.0.fix'),
      contact: null,
    },
  ],
  limits: [unknownClaim('limits.0')],
  conflicts: [],
  difficultyBreakdown: { reviewGate: 2, approvalWait: 2, prerequisites: 1, hiddenLimits: 1, total: 6, score: 4 },
})

export const sampleSummary: GuideSummary = {
  slug: 'example',
  appName: 'Example',
  archetype: 'hidden_limits',
  difficulty: 4,
  mode: 'library',
  asOf: '2026-10-28T00:00:00.000Z',
}

export const sampleSnapshot: RunSnapshot = {
  runId: RUN_ID,
  slug: 'example',
  status: 'running',
  stageReached: 0,
  startedAt: '2026-10-28T10:00:00.000Z',
  finishedAt: null,
}

type EventType = RunStreamEvent['type']
type EventBody<T extends EventType> = Omit<Extract<RunStreamEvent, { type: T }>, 'type' | 'runId'>

/** Builds a stream event of one type for run `RUN_ID`. */
export function runEvent<T extends EventType>(type: T, body: EventBody<T>): Extract<RunStreamEvent, { type: T }> {
  // The spread of a generic Omit is not seen as the full event by the compiler, so the result is asserted once, here.
  return { type, runId: RUN_ID, ...body } as Extract<RunStreamEvent, { type: T }>
}
