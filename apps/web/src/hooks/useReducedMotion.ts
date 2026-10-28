/**
 * File: useReducedMotion.ts
 * Purpose: Reports whether the visitor asked their system for reduced motion.
 * Exports: useReducedMotion
 * Used by: components/landing/HeroVideo.tsx, components/landing/HowItWorksStepper.tsx, components/verdict/StampMark.tsx
 */
import { useMediaQuery } from './useMediaQuery'

/** True when the system asks for reduced motion; updates if the setting changes. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
