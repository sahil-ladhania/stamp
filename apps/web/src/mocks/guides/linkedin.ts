/**
 * File: linkedin.ts
 * Purpose: Mock library guide for LinkedIn (partner-gated). Only the docs' facts are Sourced.
 * Exports: linkedinGuide
 * Used by: mocks/guides/index.ts
 */
import { NO_SOURCE_REASON, sourcedClaim, uncertainClaim } from '../claim-helpers'
import { MOCK_AS_OF, SOURCES } from '../sources'
import type { Guide } from '../types'

const { linkedinPartnerGuide } = SOURCES
const VETTING_TEXT = 'API access needs vetting.'
const SECOND_REVIEW_TEXT = 'A second review follows, with a screen recording.'

export const linkedinGuide: Guide = {
  slug: 'linkedin',
  appName: 'LinkedIn',
  archetype: 'partner_gated',
  mode: 'library',
  status: 'full',
  asOf: MOCK_AS_OF,
  headline: 'API access needs vetting, then a second review',
  difficulty: {
    score: 4,
    total: 7,
    label: 'uncertain',
    factors: [
      { name: 'Review gate', points: 3, max: 3, reason: 'Partner vetting is required for API access.' },
      { name: 'Approval wait', points: 2, max: 3, reason: 'Unknown. The rule counts an unknown wait as 2 points.' },
      { name: 'Prerequisites', points: 2, max: 2, reason: 'A vetting form and a screen recording.' },
      { name: 'Hidden limits', points: 0, max: 1, reason: 'None found in the sources.' },
    ],
  },
  milestones: [
    {
      id: 'first-test',
      title: 'First test connection',
      duration: 'Unknown',
      wait: 'Vetting comes first',
      claims: [sourcedClaim('milestones.first-test', VETTING_TEXT, [linkedinPartnerGuide])],
    },
    {
      id: 'production',
      title: 'Production',
      duration: 'Unknown',
      wait: 'A second review with a screen recording',
      claims: [sourcedClaim('milestones.production', SECOND_REVIEW_TEXT, [linkedinPartnerGuide])],
    },
  ],
  nextStepId: 'steps.1',
  topBlockerId: 'blockers.1',
  steps: [
    {
      id: 'steps.1',
      title: 'Submit the vetting form',
      actor: 'human',
      effort: 'Unknown',
      detail: VETTING_TEXT,
      claim: sourcedClaim('steps.1', VETTING_TEXT, [linkedinPartnerGuide]),
    },
    {
      id: 'steps.2',
      title: 'Record the screen recording',
      actor: 'human',
      effort: 'Unknown',
      detail: SECOND_REVIEW_TEXT,
      claim: sourcedClaim('steps.2', SECOND_REVIEW_TEXT, [linkedinPartnerGuide]),
    },
    {
      id: 'steps.3',
      title: 'Pass the second review',
      actor: 'human',
      effort: 'Unknown',
      detail: null,
      claim: uncertainClaim('steps.3', 'The second review wait is unknown.', NO_SOURCE_REASON),
    },
  ],
  blockers: [
    {
      id: 'blockers.1',
      title: 'API access needs vetting',
      symptom: 'You cannot call the API yet.',
      cause: VETTING_TEXT,
      fix: null,
      contact: null,
      claim: sourcedClaim('blockers.1', VETTING_TEXT, [linkedinPartnerGuide]),
    },
  ],
  conflicts: [],
  sources: [linkedinPartnerGuide],
  uncertainSections: [],
}
