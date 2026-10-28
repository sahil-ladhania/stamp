/**
 * File: hubspot.ts
 * Purpose: Mock library guide for HubSpot (hidden limits). Facts come only from the docs;
 *          anything the docs are silent on is Unknown and Uncertain.
 * Exports: hubspotGuide
 * Used by: mocks/guides/index.ts
 */
import { NO_SOURCE_REASON, TIME_UNTESTED_REASON, sourcedClaim, uncertainClaim } from '../claim-helpers'
import { MOCK_AS_OF, SOURCES } from '../sources'
import type { Guide } from '../types'

const { hubspotChangelog, hubspotForum, composioCustomVsManaged, composioCustomAuth } = SOURCES
const CAP_TEXT = 'New HubSpot apps stop at 25 installs until they are listed on the Marketplace.'

export const hubspotGuide: Guide = {
  slug: 'hubspot',
  appName: 'HubSpot',
  archetype: 'hidden-limits',
  mode: 'library',
  status: 'full',
  asOf: MOCK_AS_OF,
  headline: 'Easy to start, capped at 25 installs until the app is listed',
  difficulty: {
    score: 4,
    total: 6,
    label: 'uncertain',
    factors: [
      { name: 'Review gate', points: 2, max: 3, reason: 'A Marketplace listing is required to scale past 25 installs.' },
      { name: 'Approval wait', points: 2, max: 3, reason: 'Unknown. The rule counts an unknown wait as 2 points.' },
      { name: 'Prerequisites', points: 1, max: 2, reason: 'A HubSpot developer account.' },
      { name: 'Hidden limits', points: 1, max: 1, reason: 'The 25 install cap.' },
    ],
  },
  milestones: [
    {
      id: 'first-test',
      title: 'First test connection',
      duration: 'About 1 hour',
      wait: 'No approval wait',
      claims: [
        uncertainClaim(
          'milestones.first-test',
          'The first test connection takes about 1 hour, with no approval wait.',
          TIME_UNTESTED_REASON,
        ),
      ],
    },
    {
      id: 'production',
      title: 'Production',
      duration: 'Unknown',
      wait: 'Needs a Marketplace listing past 25 installs',
      claims: [
        sourcedClaim('milestones.production', CAP_TEXT, [hubspotChangelog]),
        uncertainClaim('milestones.production-wait', 'The wait for a Marketplace listing is unknown.', NO_SOURCE_REASON),
      ],
    },
  ],
  nextStepId: 'steps.1',
  topBlockerId: 'blockers.1',
  steps: [
    {
      id: 'steps.1',
      title: 'Create a developer account',
      actor: 'human',
      effort: 'About 10 min',
      detail: null,
      claim: uncertainClaim('steps.1', 'Create a HubSpot developer account.', TIME_UNTESTED_REASON),
    },
    {
      id: 'steps.2',
      title: 'Create the provider OAuth app',
      actor: 'human',
      effort: 'Unknown',
      detail: null,
      claim: uncertainClaim('steps.2', 'Create a provider OAuth app in the developer account.', NO_SOURCE_REASON),
    },
    {
      id: 'steps.3',
      title: 'Choose scopes',
      actor: 'human',
      effort: 'Unknown',
      detail: 'Example scope: crm.objects.contacts.read',
      claim: uncertainClaim('steps.3', 'Choose the scopes your agent needs.', NO_SOURCE_REASON),
    },
    {
      id: 'steps.4',
      title: 'Add the redirect URL',
      actor: 'agent-assist',
      effort: 'Unknown',
      detail: 'Composio docs show two different callback paths. See the source conflict below.',
      claim: uncertainClaim('steps.4', 'The callback path is /api/v3/ or /api/v3.1/.', 'Sources disagree', [
        composioCustomVsManaged,
        composioCustomAuth,
      ]),
    },
    {
      id: 'steps.5',
      title: 'Copy the client ID and secret into the auth config',
      actor: 'agent-assist',
      effort: 'Unknown',
      detail: 'Copy the client secret into the auth config.',
      claim: uncertainClaim('steps.5', 'Copy the client ID and secret into the auth config.', NO_SOURCE_REASON),
    },
    {
      id: 'steps.6',
      title: 'Run the first test connection',
      actor: 'agent',
      effort: 'Unknown',
      detail: null,
      claim: uncertainClaim('steps.6', 'Run a first test connection.', NO_SOURCE_REASON),
    },
    {
      id: 'steps.7',
      title: 'Keep installs under 25',
      actor: 'agent',
      effort: 'Ongoing',
      detail: CAP_TEXT,
      claim: sourcedClaim('steps.7', CAP_TEXT, [hubspotChangelog]),
    },
    {
      id: 'steps.8',
      title: 'Apply for a Marketplace listing',
      actor: 'human',
      effort: 'Unknown',
      detail: 'Needed before the 26th install.',
      claim: sourcedClaim('steps.8', 'The 26th install is blocked until the app is listed.', [hubspotChangelog]),
    },
  ],
  blockers: [
    {
      id: 'blockers.1',
      title: 'The 26th install is blocked',
      symptom: 'The 26th install is blocked.',
      cause: CAP_TEXT,
      fix: 'List the app on the HubSpot Marketplace.',
      contact: null,
      claim: sourcedClaim('blockers.1', 'The 26th install is blocked until the app is listed.', [hubspotChangelog]),
    },
    {
      id: 'blockers.2',
      title: 'AI connectors have extra listing rules',
      symptom: 'Your app is treated as an AI connector.',
      cause: 'HubSpot treats apps that connect it to AI agents as AI connectors, with extra listing rules.',
      fix: null,
      contact: null,
      claim: sourcedClaim('blockers.2', 'AI connectors have extra listing rules.', [hubspotForum]),
    },
    {
      id: 'blockers.3',
      title: 'A 400 error at token exchange',
      symptom: 'A 400 error at token exchange.',
      cause: 'Likely a wrong client secret.',
      fix: 'Copy the current client secret into the auth config.',
      contact: null,
      claim: uncertainClaim('blockers.3', 'A 400 at token exchange is likely a wrong client secret.', NO_SOURCE_REASON),
    },
  ],
  conflicts: [
    {
      id: 'conflicts.1',
      topic: 'Callback path in Composio docs',
      options: [
        {
          claim: uncertainClaim('conflicts.1.a', 'The callback path is /api/v3/.', 'Sources disagree', [composioCustomVsManaged]),
          isTrusted: false,
        },
        {
          claim: uncertainClaim('conflicts.1.b', 'The callback path is /api/v3.1/.', 'Sources disagree', [composioCustomAuth]),
          isTrusted: false,
        },
      ],
      reason: 'Both pages are Composio docs. Stamp keeps both and trusts neither until one is tested.',
    },
  ],
  sources: [hubspotChangelog, hubspotForum, composioCustomVsManaged, composioCustomAuth],
  uncertainSections: [],
}
