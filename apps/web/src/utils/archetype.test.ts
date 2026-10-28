/**
 * File: archetype.test.ts
 * Purpose: Tests that every archetype in the shared schema has a label and a blurb, and that the blurbs follow the copy rules.
 * Exports: none
 * Used by: vitest
 */
import { ArchetypeSchema } from '@stamp/schema'
import { describe, expect, it } from 'vitest'
import { ARCHETYPE_BLURB, ARCHETYPE_LABEL } from './archetype'

describe('archetype copy', () => {
  it.each(ArchetypeSchema.options)('has a label and a blurb for %s', (archetype) => {
    expect(ARCHETYPE_LABEL[archetype].length).toBeGreaterThan(2)
    expect(ARCHETYPE_BLURB[archetype].length).toBeGreaterThan(10)
  })

  it('writes blurbs as sentences without em dashes or "please"', () => {
    for (const blurb of Object.values(ARCHETYPE_BLURB)) {
      expect(blurb).toMatch(/^[A-Z].*\.$/)
      expect(blurb).not.toMatch(/—|–|please/i)
    }
  })
})
