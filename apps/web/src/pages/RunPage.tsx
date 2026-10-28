/**
 * File: RunPage.tsx
 * Purpose: Live run route `/run/:id`. Placeholder until step 5.
 * Exports: RunPage
 * Used by: router.tsx
 */
import type { ReactElement } from 'react'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { PAGE_SCENARIOS } from '@/mocks/scenarios'

export function RunPage(): ReactElement {
  return <PlaceholderPage title="Live run" route="/run/:id" step={5} scenarios={PAGE_SCENARIOS.run} />
}
