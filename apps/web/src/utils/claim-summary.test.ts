/**
 * File: claim-summary.test.ts
 * Purpose: Tests the claims sentence: Sourced is never called confirmed, and tested claims are named when there are any.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { sourcedClaim, unknownClaim } from '@/test-support/sample-data'
import { mapClaim } from './map-claim'
import { claimSummary } from './claim-summary'

const sourced = (id: string) => mapClaim(sourcedClaim(id))
const unknown = (id: string) => mapClaim(unknownClaim(id))

describe('claimSummary', () => {
  it('says sourced, and leaves Uncertain out of the count', () => {
    expect(claimSummary([sourced('a'), sourced('b'), unknown('d')]).text).toBe('2 of 3 claims sourced')
  })

  it('names tested claims separately, since only Tested is confirmed', () => {
    const tested = { ...sourced('c'), label: 'tested' as const }
    const result = claimSummary([sourced('a'), tested, unknown('d')])
    expect(result).toEqual({ tested: 1, sourced: 1, total: 3, text: '1 tested, 1 sourced of 3 claims' })
  })

  it('uses the singular for one claim', () => {
    expect(claimSummary([unknown('a')]).text).toBe('0 of 1 claim sourced')
  })

  it('never uses the word confirmed', () => {
    expect(claimSummary([sourced('a')]).text).not.toMatch(/confirmed/)
  })

  it('handles no claims', () => {
    expect(claimSummary([]).text).toBe('0 of 0 claims sourced')
  })
})
