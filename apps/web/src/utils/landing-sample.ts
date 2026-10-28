/**
 * File: landing-sample.ts
 * Purpose: The state of the sample guide the Landing page shows as a real example: loading, missing (not in the library
 *          yet, or the request failed) or ready. Missing is not an error: the page reads fine without the example.
 * Exports: LandingSample, getLandingSample
 * Used by: pages/LandingPage.tsx, components/landing/*
 */
import type { Guide } from '@/types/guide-model'

export type LandingSample =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; guide: Guide }

export function getLandingSample({
  isLoading,
  guide,
}: {
  isLoading: boolean
  guide: Guide | null
}): LandingSample {
  if (isLoading) return { status: 'loading' }
  return guide ? { status: 'ready', guide } : { status: 'missing' }
}

/** The guide when there is one, for the parts of the page that only need it or nothing. */
export function sampleGuideOf(sample: LandingSample): Guide | null {
  return sample.status === 'ready' ? sample.guide : null
}
