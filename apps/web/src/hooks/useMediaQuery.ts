/**
 * File: useMediaQuery.ts
 * Purpose: Reports whether a CSS media query matches, and updates when it changes.
 * Exports: useMediaQuery
 * Used by: hooks/useReducedMotion.ts, components/evidence/ClaimEvidence.tsx, components/landing/HowItWorksStepper.tsx
 */
import { useSyncExternalStore } from 'react'

/** True while `query` matches, for example `(min-width: 64rem)`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
