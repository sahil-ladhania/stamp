/**
 * File: active-section.test.ts
 * Purpose: Tests the active section pick and the scroll progress maths.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { pickActiveSection, scrollProgress } from './active-section'

const sections = [
  { id: 'verdict', top: -300 },
  { id: 'timeline', top: 80 },
  { id: 'steps', top: 700 },
]

describe('pickActiveSection', () => {
  it('picks the last section whose top has passed the offset', () => {
    expect(pickActiveSection(sections, 120)).toBe('timeline')
    expect(pickActiveSection(sections, 800)).toBe('steps')
  })

  it('picks the first section while none has reached the offset', () => {
    expect(pickActiveSection([{ id: 'a', top: 400 }, { id: 'b', top: 900 }], 100)).toBe('a')
  })

  it('is null with no sections', () => {
    expect(pickActiveSection([], 100)).toBeNull()
  })
})

describe('scrollProgress', () => {
  it('is 0 above the first top and 1 below the last', () => {
    expect(scrollProgress(100, 500, 20)).toBe(0)
    expect(scrollProgress(100, 500, 900)).toBe(1)
  })

  it('is linear between the two', () => {
    expect(scrollProgress(100, 500, 300)).toBe(0.5)
  })

  it('is 0 when there is nothing to progress through', () => {
    expect(scrollProgress(300, 300, 400)).toBe(0)
  })
})
