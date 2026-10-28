/**
 * File: library-times.test.ts
 * Purpose: Tests the library row times: a stated duration keeps its label, and a missing one is null.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { guideWith } from '@/test-support/guide-fixtures'
import { sampleGuide } from '@/test-support/sample-data'
import { libraryTimes } from './library-times'

describe('libraryTimes', () => {
  it('is null for both when the guide states no duration', () => {
    expect(libraryTimes(sampleGuide)).toEqual({ firstTest: null, production: null })
  })

  it('reads the first test from its wait claim and keeps the claim label', () => {
    const m = sampleGuide.milestones
    const guide = guideWith({
      milestones: {
        ...m,
        firstTest: { ...m.firstTest, wait: { ...m.firstTest.wait, text: 'A page appears in under two minutes.' } },
      },
    })
    expect(libraryTimes(guide).firstTest).toEqual({ duration: 'under two minutes', label: 'uncertain' })
  })

  it('reads production from its effort only, not from the approval wait', () => {
    const m = sampleGuide.milestones
    const guide = guideWith({
      milestones: { ...m, production: { ...m.production, wait: { ...m.production.wait, text: 'Review takes 3 to 7 days.' } } },
    })
    expect(libraryTimes(guide).production).toBeNull()
  })
})
