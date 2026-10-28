/**
 * File: gmail.ts
 * Purpose: Mock library guide for Gmail (review needed). Only the docs' facts are Sourced.
 * Exports: gmailGuide
 * Used by: mocks/guides/index.ts
 */
import { NO_SOURCE_REASON, sourcedClaim, uncertainClaim } from '../claim-helpers'
import { MOCK_AS_OF, SOURCES } from '../sources'
import type { Guide } from '../types'

const { googleVerification } = SOURCES
const CASA_TEXT = 'Restricted scopes need a third-party security assessment (CASA): weeks plus a fee.'

export const gmailGuide: Guide = {
  slug: 'gmail',
  appName: 'Gmail',
  archetype: 'review-needed',
  mode: 'library',
  status: 'full',
  asOf: MOCK_AS_OF,
  headline: 'Restricted scopes need a third-party security assessment',
  difficulty: {
    score: 3,
    total: 5,
    label: 'uncertain',
    factors: [
      { name: 'Review gate', points: 3, max: 3, reason: 'A security assessment (CASA) is required for restricted scopes.' },
      { name: 'Approval wait', points: 2, max: 3, reason: 'Weeks, which falls in the 1 to 4 weeks band.' },
      { name: 'Prerequisites', points: 0, max: 2, reason: 'None found in the sources.' },
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
      duration: 'Weeks plus a fee',
      wait: 'Third-party security assessment',
      claims: [sourcedClaim('milestones.production', CASA_TEXT, [googleVerification])],
    },
  ],
  nextStepId: 'steps.1',
  topBlockerId: 'blockers.1',
  steps: [
    {
      id: 'steps.1',
      title: 'Create the provider OAuth app in Google',
      actor: 'human',
      effort: 'Unknown',
      detail: null,
      claim: uncertainClaim('steps.1', 'Create a provider OAuth app in Google.', NO_SOURCE_REASON),
    },
    {
      id: 'steps.2',
      title: 'Pass the security assessment',
      actor: 'human',
      effort: 'Weeks plus a fee',
      detail: CASA_TEXT,
      claim: sourcedClaim('steps.2', CASA_TEXT, [googleVerification]),
    },
    {
      id: 'steps.3',
      title: 'Run the first test connection',
      actor: 'agent',
      effort: 'Unknown',
      detail: null,
      claim: uncertainClaim('steps.3', 'Run a first test connection.', NO_SOURCE_REASON),
    },
  ],
  blockers: [
    {
      id: 'blockers.1',
      title: 'Restricted scopes need an assessment',
      symptom: 'Your app requests restricted scopes.',
      cause: 'Restricted scopes need a third-party security assessment (CASA).',
      fix: 'Complete the assessment. Expect weeks plus a fee.',
      contact: null,
      claim: sourcedClaim('blockers.1', CASA_TEXT, [googleVerification]),
    },
  ],
  conflicts: [],
  sources: [googleVerification],
  uncertainSections: [],
}
