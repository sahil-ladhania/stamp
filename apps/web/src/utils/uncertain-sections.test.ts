/**
 * File: uncertain-sections.test.ts
 * Purpose: Tests which sections a guide marks Uncertain, from claim labels and coverage.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { conflictGuide, emptyPartialGuide, guideWith, partialGuide } from '@/test-support/guide-fixtures'
import { sampleGuide, unknownClaim } from '@/test-support/sample-data'
import { computeUncertainSections, GUIDE_SECTION } from './uncertain-sections'

describe('computeUncertainSections', () => {
  it('flags nothing on a full guide with sourced steps and blockers', () => {
    expect(computeUncertainSections(sampleGuide)).toEqual([])
  })

  it('does not flag Steps because step efforts are Uncertain, since time estimates always are', () => {
    expect(computeUncertainSections(sampleGuide)).not.toContain(GUIDE_SECTION.steps)
  })

  it('flags Blockers when every blocker claim is Uncertain, and Source conflicts on a partial guide with none', () => {
    expect(computeUncertainSections(partialGuide)).toEqual([GUIDE_SECTION.blockers, GUIDE_SECTION.conflicts])
  })

  it('flags Steps when every step detail is Uncertain', () => {
    const guide = guideWith({
      steps: [{ ...sampleGuide.steps[0]!, detail: unknownClaim('steps.0.detail') }],
    })
    expect(computeUncertainSections(guide)).toEqual([GUIDE_SECTION.steps])
  })

  it('does not flag Blockers when only some claims are Uncertain', () => {
    expect(computeUncertainSections(sampleGuide)).not.toContain(GUIDE_SECTION.blockers)
  })

  it('flags empty Steps and Blockers on a partial guide, where nothing found and not reached look the same', () => {
    expect(computeUncertainSections(emptyPartialGuide)).toEqual([
      GUIDE_SECTION.steps, GUIDE_SECTION.blockers, GUIDE_SECTION.conflicts,
    ])
  })

  it('does not flag empty sections on a full guide', () => {
    expect(computeUncertainSections(guideWith({ steps: [], blockers: [] }))).toEqual([])
  })

  it('does not flag Source conflicts when conflicts exist, even on a partial guide', () => {
    const guide = guideWith({ coverage: 'partial', conflicts: conflictGuide.conflicts })
    expect(computeUncertainSections(guide)).not.toContain(GUIDE_SECTION.conflicts)
  })
})
