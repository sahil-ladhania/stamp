/**
 * File: verify-examples.ts
 * Purpose: EDITORIAL worked examples for the How we verify page: HubSpot's difficulty breakdown and two source
 *          conflicts. They illustrate the rules and are not API data. The conflict texts are shortened, not verbatim
 *          quotes, and their reasons are Stamp's wording, so they carry no evidence label.
 * Exports: HUBSPOT_EXAMPLE, SALESFORCE_CONFLICT, HUBSPOT_CONFLICT
 * Used by: components/verify/DifficultySection.tsx, components/verify/ConflictsSection.tsx
 */
import type { Claim, Conflict, Difficulty, Source } from '@/types/guide-model'

export const HUBSPOT_EXAMPLE: { slug: string; appName: string; difficulty: Difficulty } = {
  slug: 'hubspot',
  appName: 'HubSpot',
  difficulty: {
    score: 4,
    total: 6,
    factors: [
      { name: 'Review gate', points: 2, max: 3, reason: 'A Marketplace listing is required to scale past 25 installs.' },
      { name: 'Approval wait', points: 2, max: 3, reason: 'Unknown. The rule counts an unknown wait as 2 points.' },
      { name: 'Prerequisites', points: 1, max: 2, reason: 'A HubSpot developer account.' },
      { name: 'Hidden limits', points: 1, max: 1, reason: 'The 25 install cap.' },
    ],
  },
}

/** Stamp's own explanation, shown as plain text: it is a rule, not a claim about a provider. */
function explanation(id: string, text: string): Claim {
  return { id, text, label: 'uncertain', sources: [] }
}

const SALESFORCE_AUTH: Source = {
  url: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm',
  title: 'Salesforce: understanding authentication',
  tier: 'official',
  quote: "New Connected Apps are restricted since Spring '26. External Client Apps replace them.",
}

const NANGO_SALESFORCE: Source = {
  url: 'https://nango.dev/docs/api-integrations/salesforce/salesforce-api-oauth-app-setup',
  title: 'Nango: Salesforce OAuth app setup',
  tier: 'third_party',
  quote: 'A popular third-party guide still recommends the Connected App path.',
}

const COMPOSIO_CUSTOM_VS_MANAGED: Source = {
  url: 'https://docs.composio.dev/docs/custom-app-vs-managed-app.md',
  title: 'Composio docs: custom app vs managed app',
  tier: 'third_party',
  quote: 'The callback path is /api/v3/.',
}

const COMPOSIO_CUSTOM_AUTH: Source = {
  url: 'https://docs.composio.dev/docs/auth-configuration/custom-auth-configs',
  title: 'Composio docs: custom auth configs',
  tier: 'third_party',
  quote: 'The callback path is /api/v3.1/.',
}

export const SALESFORCE_CONFLICT: Conflict = {
  id: 'example.salesforce',
  topic: 'Which app type to create',
  options: [
    { source: SALESFORCE_AUTH, isTrusted: true },
    { source: NANGO_SALESFORCE, isTrusted: false },
  ],
  reason: explanation('example.salesforce.reason', 'Official sources win over third-party guides.'),
}

export const HUBSPOT_CONFLICT: Conflict = {
  id: 'example.hubspot',
  topic: 'Callback path in Composio docs',
  options: [
    { source: COMPOSIO_CUSTOM_VS_MANAGED, isTrusted: false },
    { source: COMPOSIO_CUSTOM_AUTH, isTrusted: false },
  ],
  reason: explanation(
    'example.hubspot.reason',
    'Both pages are Composio docs. Stamp keeps both and trusts neither until one is tested.',
  ),
}
