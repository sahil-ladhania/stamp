/**
 * File: not-found-copy.test.ts
 * Purpose: Tests the Not found wording and actions for each hint: a guide link, a real "research live" action, or none.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { sampleSummary } from '@/test-support/sample-data'
import { getNotFoundCopy } from './not-found-copy'

describe('getNotFoundCopy', () => {
  it('links to the suggested guide', () => {
    const copy = getNotFoundCopy({ kind: 'suggestion', guide: { ...sampleSummary, slug: 'hubspot', appName: 'HubSpot' } })
    expect(copy.question).toBe('Did you mean HubSpot?')
    expect(copy.action).toEqual({ kind: 'link', label: 'Open the HubSpot guide', to: '/g/hubspot' })
  })

  it('offers to research an unknown app live, as a real action and not a link to a demo run', () => {
    const copy = getNotFoundCopy({ kind: 'unknown-guide', appName: 'Notion' })
    expect(copy.heading).toBe('No guide for Notion yet')
    expect(copy.action).toEqual({ kind: 'research', label: 'Research Notion live', app: 'Notion' })
    expect(copy.stampRows.map((row) => row.value)).toEqual(['No guide yet', 'Not researched', 'Research Notion live'])
  })

  it('has no lead action by default, and points the stamp at search', () => {
    const copy = getNotFoundCopy({ kind: 'default' })
    expect(copy.action).toBeNull()
    expect(copy.stampRows[2]?.value).toBe('Search for the app you meant')
  })
})
