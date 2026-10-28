/**
 * File: map-conflicts.test.ts
 * Purpose: Tests the conflict mapper: the trusted option follows the preferred URL, on either side or on neither.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { conflictGuide } from '@/test-support/guide-fixtures'
import { mapConflicts } from './map-conflicts'

const [conflict] = conflictGuide.conflicts
if (!conflict) throw new Error('The conflict fixture has no conflict')

describe('mapConflicts', () => {
  it('maps the two sources to options with their quote and tier', () => {
    const [mapped] = mapConflicts([conflict])
    expect(mapped?.options.map((option) => option.source.tier)).toEqual(['forum', 'official'])
    expect(mapped?.options[1]?.source.quote).toBe('Use the v3 callback path.')
  })

  it('trusts the option whose URL is the preferred one', () => {
    const [mapped] = mapConflicts([conflict])
    expect(mapped?.options.map((option) => option.isTrusted)).toEqual([false, true])
  })

  it('trusts the first option when it is the preferred one', () => {
    const [mapped] = mapConflicts([{ ...conflict, preferredUrl: conflict.sourceA.url }])
    expect(mapped?.options.map((option) => option.isTrusted)).toEqual([true, false])
  })

  it('trusts neither when the preferred URL matches neither', () => {
    const [mapped] = mapConflicts([{ ...conflict, preferredUrl: 'https://other.example.com/' }])
    expect(mapped?.options.map((option) => option.isTrusted)).toEqual([false, false])
  })

  it('keeps the reason as a claim with its own label', () => {
    const [mapped] = mapConflicts([conflict])
    expect(mapped?.reason).toMatchObject({ id: 'conflicts.0.reason', label: 'sourced' })
  })
})
