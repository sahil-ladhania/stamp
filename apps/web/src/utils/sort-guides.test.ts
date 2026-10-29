/**
 * File: sort-guides.test.ts
 * Purpose: Tests the difficulty sort: both directions, alphabetical ties either way, guides that are Not rated always last, and no change to the input.
 * Exports: none
 * Used by: vitest
 */
import type { GuideSummary } from '@stamp/schema'
import { describe, expect, it } from 'vitest'
import { sampleSummary } from '@/test-support/sample-data'
import { sortByDifficulty } from './sort-guides'

function guide(appName: string, difficulty: number, archetype: GuideSummary['archetype'] = 'hidden_limits'): GuideSummary {
  return { ...sampleSummary, slug: appName.toLowerCase(), appName, difficulty, archetype }
}

const guides = [guide('Slack', 5), guide('HubSpot', 4), guide('Zoom', 1), guide('Asana', 4)]
const names = (list: GuideSummary[]) => list.map((item) => item.appName)

describe('sortByDifficulty', () => {
  it('puts the easiest first and breaks ties alphabetically', () => {
    expect(names(sortByDifficulty(guides, 'easiest'))).toEqual(['Zoom', 'Asana', 'HubSpot', 'Slack'])
  })

  it('puts the hardest first and still breaks ties alphabetically', () => {
    expect(names(sortByDifficulty(guides, 'hardest'))).toEqual(['Slack', 'Asana', 'HubSpot', 'Zoom'])
  })

  it('returns a new array and leaves the input alone', () => {
    const before = guides.map((item) => item.appName)
    sortByDifficulty(guides, 'hardest')
    expect(guides.map((item) => item.appName)).toEqual(before)
  })

  describe('a guide that is Not rated', () => {
    // Its stored difficulty is only a lower bound, so it must not read as the easiest or the hardest app.
    const notRated = [guide('GitHub', 2, 'unknown'), guide('Notion', 5, 'unknown')]
    const mixed = [...notRated, ...guides]

    it('comes after every rated guide when sorting easiest first', () => {
      expect(names(sortByDifficulty(mixed, 'easiest'))).toEqual(['Zoom', 'Asana', 'HubSpot', 'Slack', 'GitHub', 'Notion'])
    })

    it('still comes after every rated guide when sorting hardest first', () => {
      expect(names(sortByDifficulty(mixed, 'hardest'))).toEqual(['Slack', 'Asana', 'HubSpot', 'Zoom', 'GitHub', 'Notion'])
    })

    it('is ordered by name, whatever its stored difficulty', () => {
      const reversed = [guide('Notion', 1, 'unknown'), guide('GitHub', 5, 'unknown')]
      expect(names(sortByDifficulty(reversed, 'easiest'))).toEqual(['GitHub', 'Notion'])
      expect(names(sortByDifficulty(reversed, 'hardest'))).toEqual(['GitHub', 'Notion'])
    })
  })
})
