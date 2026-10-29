/**
 * File: section-uncertainty.test.ts
 * Purpose: Tests the "mostly Uncertain" rule: more than half, empty counts, and step efforts are left out.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { emptyPartialGuide, partialGuide } from '@/test-support/guide-fixtures'
import { sampleGuide, sourcedClaim, unknownClaim } from '@/test-support/sample-data'
import { isMostlyUncertain, sectionUncertainty } from './section-uncertainty'
import { mapClaim } from './map-claim'
import { mapGuide } from './map-guide'

const sourced = (id: string) => mapClaim(sourcedClaim(id))
const unknown = (id: string) => mapClaim(unknownClaim(id))

describe('isMostlyUncertain', () => {
  it('needs more than half, so an even split is not mostly Uncertain', () => {
    expect(isMostlyUncertain([sourced('a'), unknown('b')])).toBe(false)
    expect(isMostlyUncertain([sourced('a'), unknown('b'), unknown('c')])).toBe(true)
  })

  it('counts an empty section as Uncertain', () => {
    expect(isMostlyUncertain([])).toBe(true)
  })
})

describe('sectionUncertainty', () => {
  it('leaves step efforts out, so sourced details are not mostly Uncertain', () => {
    expect(sectionUncertainty(mapGuide(sampleGuide)).steps).toBe(false)
  })

  it('marks the timeline Uncertain when its time claims are, as time estimates always are', () => {
    expect(sectionUncertainty(mapGuide(sampleGuide)).timeline).toBe(true)
  })

  it('marks blockers whose claims are all unknown', () => {
    expect(sectionUncertainty(mapGuide(partialGuide)).blockers).toBe(true)
    expect(sectionUncertainty(mapGuide(sampleGuide)).blockers).toBe(false)
  })

  it('marks empty sections', () => {
    const result = sectionUncertainty(mapGuide(emptyPartialGuide))
    expect(result).toMatchObject({ steps: true, blockers: true })
  })
})
