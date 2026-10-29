/**
 * File: confirmed-summary.test.ts
 * Purpose: Tests the confirmed-claims sentence.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { sourcedClaim, unknownClaim } from '@/test-support/sample-data'
import { mapClaim } from './map-claim'
import { confirmedSummary } from './confirmed-summary'

const sourced = (id: string) => mapClaim(sourcedClaim(id))
const unknown = (id: string) => mapClaim(unknownClaim(id))

describe('confirmedSummary', () => {
  it('counts Sourced and Tested as confirmed and leaves Uncertain out', () => {
    const tested = { ...sourced('c'), label: 'tested' as const }
    const result = confirmedSummary([sourced('a'), sourced('b'), tested, unknown('d')])
    expect(result).toEqual({ confirmed: 3, total: 4, text: '3 of 4 claims confirmed' })
  })

  it('uses the singular for one claim', () => {
    expect(confirmedSummary([unknown('a')]).text).toBe('0 of 1 claim confirmed')
  })

  it('handles no claims', () => {
    expect(confirmedSummary([]).text).toBe('0 of 0 claims confirmed')
  })
})
