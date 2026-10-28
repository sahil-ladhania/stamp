/**
 * File: salesforce.ts
 * Purpose: Mock library guide for Salesforce (enterprise), with the official vs third-party conflict.
 * Exports: salesforceGuide
 * Used by: mocks/guides/index.ts
 */
import { NO_SOURCE_REASON, sourcedClaim, uncertainClaim } from '../claim-helpers'
import { MOCK_AS_OF, SOURCES } from '../sources'
import type { Guide } from '../types'

const { salesforceAuth, nangoSalesforce } = SOURCES
const RESTRICTED_TEXT = "New Connected Apps are restricted since Spring '26. External Client Apps replace them."

export const salesforceGuide: Guide = {
  slug: 'salesforce',
  appName: 'Salesforce',
  archetype: 'enterprise',
  mode: 'library',
  status: 'full',
  asOf: MOCK_AS_OF,
  headline: 'New Connected Apps are restricted',
  difficulty: {
    score: 2,
    total: 3,
    label: 'uncertain',
    factors: [
      { name: 'Review gate', points: 0, max: 3, reason: 'No review gate found in the sources.' },
      { name: 'Approval wait', points: 2, max: 3, reason: 'Unknown. The rule counts an unknown wait as 2 points.' },
      { name: 'Prerequisites', points: 1, max: 2, reason: 'An External Client App instead of a Connected App.' },
      { name: 'Hidden limits', points: 0, max: 1, reason: 'None found in the sources.' },
    ],
  },
  milestones: [
    {
      id: 'first-test',
      title: 'First test connection',
      duration: 'Unknown',
      wait: 'Unknown',
      claims: [uncertainClaim('milestones.first-test', 'The time to a first test connection is unknown.', NO_SOURCE_REASON)],
    },
    {
      id: 'production',
      title: 'Production',
      duration: 'Unknown',
      wait: 'Unknown',
      claims: [uncertainClaim('milestones.production', 'The time to production is unknown.', NO_SOURCE_REASON)],
    },
  ],
  nextStepId: 'steps.1',
  topBlockerId: 'blockers.1',
  steps: [
    {
      id: 'steps.1',
      title: 'Create an External Client App',
      actor: 'human',
      effort: 'Unknown',
      detail: 'Do not create a Connected App.',
      claim: sourcedClaim('steps.1', RESTRICTED_TEXT, [salesforceAuth]),
    },
    {
      id: 'steps.2',
      title: 'Add the redirect URL and scopes',
      actor: 'agent_assist',
      effort: 'Unknown',
      detail: null,
      claim: uncertainClaim('steps.2', 'Add the redirect URL and scopes.', NO_SOURCE_REASON),
    },
  ],
  blockers: [
    {
      id: 'blockers.1',
      title: 'New Connected Apps are restricted',
      symptom: 'You cannot create a new Connected App.',
      cause: "Salesforce restricted new Connected Apps in Spring '26.",
      fix: 'Create an External Client App instead.',
      contact: null,
      claim: sourcedClaim('blockers.1', RESTRICTED_TEXT, [salesforceAuth]),
    },
  ],
  conflicts: [
    {
      id: 'conflicts.1',
      topic: 'Which app type to create',
      options: [
        { claim: sourcedClaim('conflicts.1.a', RESTRICTED_TEXT, [salesforceAuth]), isTrusted: true },
        {
          claim: uncertainClaim(
            'conflicts.1.b',
            'A popular third-party guide still recommends the Connected App path.',
            'Only an old source exists',
            [nangoSalesforce],
          ),
          isTrusted: false,
        },
      ],
      reason: 'Official sources win over third-party guides.',
    },
  ],
  sources: [salesforceAuth, nangoSalesforce],
  uncertainSections: [],
}
