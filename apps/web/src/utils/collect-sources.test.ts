/**
 * File: collect-sources.test.ts
 * Purpose: Tests the top-level source list: every source once, official first, conflict sources included.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { conflictGuide, guideWith } from '@/test-support/guide-fixtures'
import { sampleGuide } from '@/test-support/sample-data'
import { collectSources } from './collect-sources'

describe('collectSources', () => {
  it('lists a URL once however many claims cite it', () => {
    const sources = collectSources(sampleGuide)
    expect(sources.map((source) => source.url)).toEqual(['https://docs.example.com/oauth'])
  })

  it('counts how many claims cite each source', () => {
    const [source] = collectSources(sampleGuide)
    // verdict summary, requirements.0, scopes.0.reason, steps.0.detail, blockers.0 symptom and cause, production.wait
    expect(source?.usedBy).toBe(7)
  })

  it('adds the sources of a conflict, which belong to no claim', () => {
    const urls = collectSources(conflictGuide).map((source) => source.url)
    expect(urls).toContain('https://forum.example.org/t/1')
  })

  it('puts official first, then third party, then forum', () => {
    const tiers = collectSources(conflictGuide).map((source) => source.tier)
    expect(tiers).toEqual(['official', 'forum'])
  })

  it('keeps first appearance within a tier', () => {
    const second = { url: 'https://docs.example.com/second', quote: 'q', tier: 'official' as const }
    const guide = guideWith({
      requirements: [
        { id: 'requirements.0', text: 'A', label: 'sourced', sources: [second] },
        { id: 'requirements.1', text: 'B', label: 'sourced', sources: [sampleGuide.verdict.summary.sources[0]!] },
      ],
    })
    const urls = collectSources(guide).map((source) => source.url)
    expect(urls.indexOf('https://docs.example.com/oauth')).toBeLessThan(urls.indexOf('https://docs.example.com/second'))
  })

  it('has no sources when no claim has one', () => {
    const bare = guideWith({
      verdict: {
        summary: { id: 'verdict.summary', text: 'Unknown.', label: 'uncertain', sources: [] },
        nextStepId: null,
        topBlockerId: null,
      },
      milestones: {
        firstTest: { effort: sampleGuide.milestones.firstTest.effort, wait: sampleGuide.milestones.firstTest.wait },
        production: { effort: sampleGuide.milestones.production.effort, wait: sampleGuide.milestones.firstTest.wait },
      },
      requirements: [],
      scopes: [],
      steps: [],
      blockers: [],
      limits: [],
    })
    expect(collectSources(bare)).toEqual([])
  })
})
