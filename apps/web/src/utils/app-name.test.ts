/**
 * File: app-name.test.ts
 * Purpose: Tests the app name the Live run page shows: the guide's name, the typed name made readable, then the slug.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { displayNameFromTyped, resolveRunAppName, slugToName } from './app-name'

describe('slugToName', () => {
  it.each([
    ['hubspot', 'Hubspot'],
    ['stub-check', 'Stub Check'],
    ['my_cool-app', 'My Cool App'],
    ['', ''],
  ])('reads "%s" as "%s"', (slug, name) => {
    expect(slugToName(slug)).toBe(name)
  })
})

describe('displayNameFromTyped', () => {
  it.each([
    ['microsoft', 'Microsoft'],
    ['  microsoft  ', 'Microsoft'],
    ['hub spot', 'Hub Spot'],
    ['HubSpot', 'HubSpot'],
    ['microsoft.com', 'Microsoft'],
    ['https://www.notion.so/product', 'Notion'],
    ['docs.github.com', 'Github'],
    ['bbc.co.uk', 'Bbc'],
  ])('reads "%s" as "%s"', (typed, name) => {
    expect(displayNameFromTyped(typed)).toBe(name)
  })

  it('is null for nothing typed', () => {
    expect(displayNameFromTyped(null)).toBeNull()
    expect(displayNameFromTyped('   ')).toBeNull()
  })
})

describe('resolveRunAppName', () => {
  it('prefers the saved guide name, which is the one the Guide page shows', () => {
    expect(resolveRunAppName({ guideName: 'Microsoft', typed: 'microsoft', slug: 'microsoft' })).toBe('Microsoft')
  })

  it('falls back to the typed name made readable', () => {
    expect(resolveRunAppName({ guideName: null, typed: 'microsoft', slug: 'microsoft' })).toBe('Microsoft')
  })

  it('falls back to the slug when nothing was typed', () => {
    expect(resolveRunAppName({ guideName: null, typed: null, slug: 'stub-check' })).toBe('Stub Check')
    expect(resolveRunAppName({ guideName: ' ', typed: '   ', slug: 'stub-check' })).toBe('Stub Check')
  })

  it('is null when there is none, as on a link that has not connected yet', () => {
    expect(resolveRunAppName({ guideName: null, typed: null, slug: null })).toBeNull()
  })
})
