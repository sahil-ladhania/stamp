/**
 * File: useGuideSlug.ts
 * Purpose: The slug of the guide being shown, for controls deep inside it (the report control) that act on that guide.
 *          Null outside a guide, so the same claim components can render on other pages without it.
 * Exports: GuideSlugContext, useGuideSlug
 * Used by: components/guide/GuideView.tsx, components/guide/ReportClaim.tsx
 */
import { createContext, useContext } from 'react'

export const GuideSlugContext = createContext<string | null>(null)

/** Returns the slug, or null when the component is not inside a guide. */
export function useGuideSlug(): string | null {
  return useContext(GuideSlugContext)
}
