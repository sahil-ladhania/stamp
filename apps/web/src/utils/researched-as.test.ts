/**
 * File: researched-as.test.ts
 * Purpose: Tests the "Researched as" line that tells a reader which product and domain a run looked at, so a wrong identity is visible.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { researchedAs } from './researched-as'

describe('researchedAs', () => {
  it('names the product phrase and the domain', () => {
    expect(researchedAs({ product: 'Gmail API', appName: 'Gmail', domain: 'google.com' })).toBe(
      'Researched as: Gmail API (google.com)',
    )
  })

  it('names the app when there is no product phrase', () => {
    expect(researchedAs({ product: null, appName: 'Notion', domain: 'notion.com' })).toBe(
      'Researched as: Notion (notion.com)',
    )
  })

  it('treats a missing product like none', () => {
    expect(researchedAs({ appName: 'Slack', domain: 'slack.com' })).toBe('Researched as: Slack (slack.com)')
  })
})
