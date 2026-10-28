/**
 * File: github.ts
 * Purpose: Mock library guide for GitHub (instant). Only the docs' facts are Sourced.
 * Exports: githubGuide
 * Used by: mocks/guides/index.ts
 */
import { NO_SOURCE_REASON, sourcedClaim, uncertainClaim } from '../claim-helpers'
import { MOCK_AS_OF, SOURCES } from '../sources'
import type { Guide } from '../types'

const { nangoGithub } = SOURCES
const NO_REVIEW = 'GitHub needs no review unless the app is listed on the GitHub Marketplace.'

export const githubGuide: Guide = {
  slug: 'github',
  appName: 'GitHub',
  archetype: 'instant',
  mode: 'library',
  status: 'full',
  asOf: MOCK_AS_OF,
  headline: 'No review unless the app is listed on the GitHub Marketplace',
  difficulty: {
    score: 1,
    total: 1,
    label: 'uncertain',
    factors: [
      { name: 'Review gate', points: 1, max: 3, reason: 'Listing on the GitHub Marketplace is optional.' },
      { name: 'Approval wait', points: 0, max: 3, reason: 'No review, so no approval wait.' },
      { name: 'Prerequisites', points: 0, max: 2, reason: 'None found in the sources.' },
      { name: 'Hidden limits', points: 0, max: 1, reason: 'None found in the sources.' },
    ],
  },
  milestones: [
    {
      id: 'first-test',
      title: 'First test connection',
      duration: 'Unknown',
      wait: 'No approval wait',
      claims: [sourcedClaim('milestones.first-test', NO_REVIEW, [nangoGithub])],
    },
    {
      id: 'production',
      title: 'Production',
      duration: 'Unknown',
      wait: 'No review unless listed',
      claims: [uncertainClaim('milestones.production', 'The time to production is unknown.', NO_SOURCE_REASON)],
    },
  ],
  nextStepId: 'steps.1',
  topBlockerId: 'blockers.1',
  steps: [
    {
      id: 'steps.1',
      title: 'Register the OAuth app in GitHub',
      actor: 'human',
      effort: 'Unknown',
      detail: null,
      claim: uncertainClaim('steps.1', 'Register your own OAuth app in GitHub.', NO_SOURCE_REASON, [nangoGithub]),
    },
    {
      id: 'steps.2',
      title: 'Add the redirect URL and scopes',
      actor: 'agent_assist',
      effort: 'Unknown',
      detail: null,
      claim: uncertainClaim('steps.2', 'Add the redirect URL and scopes.', NO_SOURCE_REASON),
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
      title: 'Marketplace listing adds a review',
      symptom: 'You list the app on the GitHub Marketplace.',
      cause: NO_REVIEW,
      fix: null,
      contact: null,
      claim: sourcedClaim('blockers.1', NO_REVIEW, [nangoGithub]),
    },
  ],
  conflicts: [],
  sources: [nangoGithub],
  uncertainSections: [],
}
