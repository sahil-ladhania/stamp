/**
 * File: LandingPage.tsx
 * Purpose: Landing route `/`. Placeholder until step 1.
 * Exports: LandingPage
 * Used by: router.tsx
 */
import type { ReactElement } from 'react'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'

export function LandingPage(): ReactElement {
  return <PlaceholderPage title="Landing" route="/" step={1} />
}
