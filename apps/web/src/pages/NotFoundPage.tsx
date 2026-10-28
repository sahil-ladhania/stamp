/**
 * File: NotFoundPage.tsx
 * Purpose: Catch-all route `*`. Placeholder until step 2.
 * Exports: NotFoundPage
 * Used by: router.tsx
 */
import type { ReactElement } from 'react'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'

export function NotFoundPage(): ReactElement {
  return <PlaceholderPage title="Page not found" route="*" step={2} />
}
