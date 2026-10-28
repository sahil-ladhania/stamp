/**
 * File: not-found-hint.test.ts
 * Purpose: Tests the Not found hint: guessing a name from an address, matching it against the loaded library, and
 *          the empty-library case.
 * Exports: none
 * Used by: vitest
 */
import type { GuideSummary } from '@stamp/schema'
import { describe, expect, it } from 'vitest'
import { sampleSummary } from '@/test-support/sample-data'
import { findGuide } from './find-guide'
import { getNotFoundHint, getSearchPrefill, guessAppName } from './not-found-hint'

function guide(slug: string, appName: string): GuideSummary {
  return { ...sampleSummary, slug, appName }
}

const library = [guide('hubspot', 'HubSpot'), guide('github', 'GitHub')]

describe('findGuide', () => {
  it('matches a slug or an app name, ignoring case and spaces', () => {
    expect(findGuide(library, 'hubspot')?.slug).toBe('hubspot')
    expect(findGuide(library, '  GITHUB ')?.slug).toBe('github')
    expect(findGuide(library, 'HubSpot')?.appName).toBe('HubSpot')
  })

  it('finds nothing for an unknown name, an empty query or an empty library', () => {
    expect(findGuide(library, 'notion')).toBeUndefined()
    expect(findGuide(library, '   ')).toBeUndefined()
    expect(findGuide([], 'hubspot')).toBeUndefined()
  })
})

describe('guessAppName', () => {
  it.each([
    ['/hubspot-setup.html', 'hubspot setup'],
    ['/g/Acme_CRM', 'Acme CRM'],
    ['/a/b/notion', 'notion'],
    ['/%E0%A4%A', ''],
    ['/', ''],
    ['/x', ''],
  ])('reads %s as "%s"', (path, name) => {
    expect(guessAppName(path)).toBe(name)
  })

  it('cuts a long name at 40 characters', () => {
    expect(guessAppName(`/${'a'.repeat(80)}`)).toHaveLength(40)
  })
})

describe('getNotFoundHint', () => {
  it('suggests a loaded guide named by a word in the address', () => {
    expect(getNotFoundHint('/hubspot-setup', library)).toEqual({ kind: 'suggestion', guide: library[0] })
  })

  it('says "no guide yet" for an unknown /g/ address, with the name capitalised', () => {
    expect(getNotFoundHint('/g/notion', library)).toEqual({ kind: 'unknown-guide', appName: 'Notion' })
  })

  it('does not suggest anything while the library is empty or not loaded', () => {
    expect(getNotFoundHint('/hubspot', [])).toEqual({ kind: 'default' })
  })

  it('still says "no guide yet" for an unknown /g/ address when the library is empty', () => {
    expect(getNotFoundHint('/g/hubspot', [])).toEqual({ kind: 'unknown-guide', appName: 'Hubspot' })
  })

  it('is the default hint for any other address', () => {
    expect(getNotFoundHint('/nowhere/at/all', library)).toEqual({ kind: 'default' })
  })

  it('prefers a loaded guide over "no guide yet"', () => {
    expect(getNotFoundHint('/g/hubspot', library).kind).toBe('suggestion')
  })
})

describe('getSearchPrefill', () => {
  it('starts with the matched app, nothing for an unknown guide, and the guessed name otherwise', () => {
    expect(getSearchPrefill('/hubspot', { kind: 'suggestion', guide: library[0]! })).toBe('HubSpot')
    expect(getSearchPrefill('/g/notion', { kind: 'unknown-guide', appName: 'Notion' })).toBe('')
    expect(getSearchPrefill('/pricing-page', { kind: 'default' })).toBe('pricing page')
  })
})
