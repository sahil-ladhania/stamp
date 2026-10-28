/**
 * File: sort-guides.test.ts
 * Purpose: Tests the difficulty sort: both directions, alphabetical ties either way, and no change to the input.
 * Exports: none
 * Used by: vitest
 */
import type { GuideSummary } from '@stamp/schema'
import { describe, expect, it } from 'vitest'
import { sampleSummary } from '@/test-support/sample-data'
import { sortByDifficulty } from './sort-guides'

function guide(appName: string, difficulty: number): GuideSummary {
  return { ...sampleSummary, slug: appName.toLowerCase(), appName, difficulty }
}

const guides = [guide('Salesforce', 5), guide('HubSpot', 4), guide('GitHub', 1), guide('Gmail', 4)]

describe('sortByDifficulty', () => {
  it('puts the easiest first and breaks ties alphabetically', () => {
    expect(sortByDifficulty(guides, 'easiest').map((item) => item.appName)).toEqual([
      'GitHub', 'Gmail', 'HubSpot', 'Salesforce',
    ])
  })

  it('puts the hardest first and still breaks ties alphabetically', () => {
    expect(sortByDifficulty(guides, 'hardest').map((item) => item.appName)).toEqual([
      'Salesforce', 'Gmail', 'HubSpot', 'GitHub',
    ])
  })

  it('returns a new array and leaves the input alone', () => {
    const before = guides.map((item) => item.appName)
    sortByDifficulty(guides, 'hardest')
    expect(guides.map((item) => item.appName)).toEqual(before)
  })
})
