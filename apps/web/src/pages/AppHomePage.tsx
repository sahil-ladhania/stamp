/**
 * File: AppHomePage.tsx
 * Purpose: App home route `/app`. Placeholder until step 4.
 * Exports: AppHomePage
 * Used by: router.tsx
 */
import type { ReactElement } from 'react'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { PAGE_SCENARIOS } from '@/mocks/scenarios'

export function AppHomePage(): ReactElement {
  return <PlaceholderPage title="App home" route="/app" step={4} scenarios={PAGE_SCENARIOS['app-home']} />
}
