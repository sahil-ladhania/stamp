/**
 * File: GuidePage.tsx
 * Purpose: Guide route `/g/:slug`. Placeholder until step 6.
 * Exports: GuidePage
 * Used by: router.tsx
 */
import type { ReactElement } from 'react'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { PAGE_SCENARIOS } from '@/mocks/scenarios'

export function GuidePage(): ReactElement {
  return <PlaceholderPage title="Guide" route="/g/:slug" step={6} scenarios={PAGE_SCENARIOS.guide} />
}
