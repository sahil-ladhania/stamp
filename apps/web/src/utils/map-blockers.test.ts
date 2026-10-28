/**
 * File: map-blockers.test.ts
 * Purpose: Tests the blocker mapper: the title taken from the symptom, the unknown case, and the optional contact.
 * Exports: none
 * Used by: vitest
 */
import type { Claim } from '@stamp/schema'
import { describe, expect, it } from 'vitest'
import { sampleGuide, sourcedClaim, unknownClaim } from '@/test-support/sample-data'
import { blockerTitle, mapBlockers, UNCONFIRMED_BLOCKER_TITLE } from './map-blockers'

function symptom(text: string): Claim {
  return { ...sourcedClaim('blockers.0.symptom'), text }
}

describe('blockerTitle', () => {
  it('is the first sentence of the symptom without its full stop', () => {
    expect(blockerTitle(symptom('Token exchange returns 400. The client secret is wrong.'))).toBe(
      'Token exchange returns 400',
    )
  })

  it('keeps a single sentence whole', () => {
    expect(blockerTitle(symptom('The 26th install is blocked.'))).toBe('The 26th install is blocked')
  })

  it('cuts a long sentence at a clause break, as a complete phrase', () => {
    expect(
      blockerTitle(
        symptom('During testing, the OAuth screen displays a strong warning page to users, discouraging most users from proceeding.'),
      ),
    ).toBe('During testing, the OAuth screen displays a strong warning page to users')
  })

  it('falls back to a word cut, never ending mid-word, when there is no clause break', () => {
    const title = blockerTitle(symptom(`${'word '.repeat(40)}end.`))
    expect(title.length).toBeLessThanOrEqual(91)
    expect(title.endsWith('…')).toBe(true)
    expect(title.slice(0, -1).trimEnd().split(' ').every((part) => part === 'word')).toBe(true)
  })

  it('does not quote an unknown symptom as a title', () => {
    expect(blockerTitle(unknownClaim('blockers.0.symptom'))).toBe(UNCONFIRMED_BLOCKER_TITLE)
  })

  it('falls back when the first sentence is empty', () => {
    expect(blockerTitle(symptom('. . .'))).toBe(UNCONFIRMED_BLOCKER_TITLE)
  })
})

describe('mapBlockers', () => {
  it('keeps symptom, cause and fix as claims and a missing contact as null', () => {
    const [blocker] = mapBlockers(sampleGuide.blockers)
    expect(blocker).toMatchObject({ id: 'blockers.0', title: 'Text for blockers.0.symptom', contact: null })
    expect(blocker?.symptom.label).toBe('sourced')
    expect(blocker?.fix.label).toBe('uncertain')
  })

  it('maps a contact claim when there is one', () => {
    const withContact = { ...sampleGuide.blockers[0]!, contact: sourcedClaim('blockers.0.contact') }
    expect(mapBlockers([withContact])[0]?.contact?.id).toBe('blockers.0.contact')
  })
})
