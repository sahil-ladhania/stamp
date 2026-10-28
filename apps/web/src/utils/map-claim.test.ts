/**
 * File: map-claim.test.ts
 * Purpose: Tests the claim mapper: the label is never changed, and only a sourceless Uncertain claim gets a reason.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { sourcedClaim, unknownClaim } from '@/test-support/sample-data'
import { mapClaim, NO_SOURCE_REASON } from './map-claim'

describe('mapClaim', () => {
  it('keeps the id, text, label and sources as the API set them', () => {
    const claim = mapClaim(sourcedClaim('steps.0.detail'))
    expect(claim).toMatchObject({ id: 'steps.0.detail', text: 'Text for steps.0.detail', label: 'sourced' })
    expect(claim.sources).toEqual([
      {
        url: 'https://docs.example.com/oauth',
        title: 'docs.example.com/oauth',
        tier: 'official',
        quote: 'Text for steps.0.detail',
      },
    ])
    expect(claim.reason).toBeUndefined()
  })

  it('gives an Uncertain claim with no source a plain reason', () => {
    expect(mapClaim(unknownClaim('limits.0'))).toMatchObject({
      label: 'uncertain',
      sources: [],
      reason: NO_SOURCE_REASON,
    })
  })

  it('gives no reason to an Uncertain claim that has a source, since the wire does not say why', () => {
    const withSource = { ...sourcedClaim('x.y'), label: 'uncertain' as const }
    expect(mapClaim(withSource).reason).toBeUndefined()
  })

  it('does not turn Tested into Sourced or the other way round', () => {
    expect(mapClaim({ ...sourcedClaim('a.b'), label: 'tested' }).label).toBe('tested')
  })
})
