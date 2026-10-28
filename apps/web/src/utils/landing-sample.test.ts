/**
 * File: landing-sample.test.ts
 * Purpose: Tests the Landing sample guide state: loading, missing and ready.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { sampleGuide } from '@/test-support/sample-data'
import { getLandingSample, sampleGuideOf } from './landing-sample'
import { mapGuide } from './map-guide'

const guide = mapGuide(sampleGuide)

describe('getLandingSample', () => {
  it('is loading while the request is in flight, even if there is no guide yet', () => {
    expect(getLandingSample({ isLoading: true, guide: null })).toEqual({ status: 'loading' })
  })

  it('is missing when the request finished with no guide (not in the library, or it failed)', () => {
    expect(getLandingSample({ isLoading: false, guide: null })).toEqual({ status: 'missing' })
  })

  it('is ready with the guide', () => {
    expect(getLandingSample({ isLoading: false, guide })).toEqual({ status: 'ready', guide })
  })
})

describe('sampleGuideOf', () => {
  it('gives the guide only when ready', () => {
    expect(sampleGuideOf({ status: 'ready', guide })).toBe(guide)
    expect(sampleGuideOf({ status: 'loading' })).toBeNull()
    expect(sampleGuideOf({ status: 'missing' })).toBeNull()
  })
})
