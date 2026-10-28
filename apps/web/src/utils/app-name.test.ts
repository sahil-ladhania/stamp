/**
 * File: app-name.test.ts
 * Purpose: Tests the app name the Live run page shows: the typed name first, the slug made readable as a fallback.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { resolveAppName, slugToName } from './app-name'

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

describe('resolveAppName', () => {
  it('prefers the typed name', () => {
    expect(resolveAppName('HubSpot', 'hubspot')).toBe('HubSpot')
  })

  it('trims the typed name', () => {
    expect(resolveAppName('  Notion ', 'notion')).toBe('Notion')
  })

  it('falls back to the slug when nothing was typed', () => {
    expect(resolveAppName(null, 'stub-check')).toBe('Stub Check')
    expect(resolveAppName('   ', 'stub-check')).toBe('Stub Check')
  })

  it('is null when there is neither, as on a link that has not connected yet', () => {
    expect(resolveAppName(null, null)).toBeNull()
  })
})
