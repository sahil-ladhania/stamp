/**
 * File: sources.ts
 * Purpose: The source pages named in docs/problem.md, docs/design-decisions.md and docs/product.md,
 *          plus the as-of date stamped on every mock guide. No other URL is used in mock data.
 * Exports: MOCK_AS_OF, SOURCES
 * Used by: mocks/guides/*.ts, mocks/run-events.ts
 */
import type { Source } from './types'

export const MOCK_AS_OF = '2026-10-28'

// Tier: provider-owned documentation is "official"; Nango, Composio and forum posts are "third-party".
export const SOURCES = {
  hubspotChangelog: {
    url: 'https://developers.hubspot.com/changelog/new-marketplace-distribution-app-install-limits',
    title: 'HubSpot changelog: Marketplace distribution app install limits',
    tier: 'official',
  },
  hubspotForum: {
    url: 'https://community.hubspot.com/t/ai-connector-as-legacy-public-app-install-limitation/148177',
    title: 'HubSpot community: AI connector as legacy public app install limitation',
    tier: 'third-party',
  },
  composioCustomVsManaged: {
    url: 'https://docs.composio.dev/docs/custom-app-vs-managed-app.md',
    title: 'Composio docs: custom app vs managed app',
    tier: 'third-party',
  },
  composioCustomAuth: {
    url: 'https://docs.composio.dev/docs/auth-configuration/custom-auth-configs',
    title: 'Composio docs: custom auth configs',
    tier: 'third-party',
  },
  nangoGithub: {
    url: 'https://www.nango.dev/docs/api-integrations/github-app-oauth/how-to-register-your-own-github-app-api-oauth-app',
    title: 'Nango: register your own GitHub OAuth app',
    tier: 'third-party',
  },
  googleVerification: {
    url: 'https://developers.google.com/health/app-verification',
    title: 'Google: app verification',
    tier: 'official',
  },
  linkedinPartnerGuide: {
    url: 'https://learn.microsoft.com/en-us/linkedin/shared/linkedin-api-partner-support-guide',
    title: 'Microsoft Learn: LinkedIn API partner support guide',
    tier: 'official',
  },
  salesforceAuth: {
    url: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm',
    title: 'Salesforce: understanding authentication',
    tier: 'official',
  },
  nangoSalesforce: {
    url: 'https://nango.dev/docs/api-integrations/salesforce/salesforce-api-oauth-app-setup',
    title: 'Nango: Salesforce OAuth app setup',
    tier: 'third-party',
  },
} as const satisfies Record<string, Source>
