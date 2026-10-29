/**
 * File: run-groups.test.ts
 * Purpose: Tests the stage groups: events land in the stage that was running, lifecycle events are not rows, the summaries read as
 *          specified, a retry adds one row, and a quote finds the tier of its page.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { runEvent } from '@/test-support/sample-data'
import { buildStageGroups } from './run-groups'
import { deriveRunView, type RunViewEvent } from './run-view'

const started = (stage: number): RunViewEvent => runEvent('stage.started', { stage, name: `stage_${stage}` })
const finished = (stage: number): RunViewEvent => runEvent('stage.done', { stage, durationMs: 1000 })
const page = (url: string, tier: 'official' | 'third_party' | 'forum'): RunViewEvent => runEvent('page.fetched', { url, tier })
const search = (query: string): RunViewEvent => runEvent('search.query', { query })

function groups(events: RunViewEvent[]) {
  return buildStageGroups(deriveRunView(events).stages, events)
}

describe('buildStageGroups', () => {
  it('makes one group per stage, with no rows for started and done', () => {
    const result = groups([started(0), finished(0), started(1), finished(1)])
    expect(result).toHaveLength(9)
    expect(result.every((group) => group.items.length === 0)).toBe(true)
    expect(result[0]).toMatchObject({ name: 'Resolve app', status: 'done', durationMs: 1000 })
  })

  it('puts each event in the stage that was running', () => {
    const result = groups([
      started(0), search('resolve query'), finished(0),
      started(2), search('a'), search('b'), finished(2),
      started(3), page('https://docs.example.com/a', 'official'),
    ])
    expect(result[0]?.items.map((item) => item.type)).toEqual(['search'])
    expect(result[2]?.items.map((item) => item.type)).toEqual(['search', 'search'])
    expect(result[3]?.items.map((item) => item.type)).toEqual(['page'])
  })

  it('ignores an event that arrives before any stage has started', () => {
    expect(groups([search('early')]).every((group) => group.items.length === 0)).toBe(true)
  })

  it('summarizes searches, pages by tier and quotes', () => {
    const result = groups([
      started(2), search('a'), search('b'), search('c'), finished(2),
      started(3),
      page('https://docs.example.com/a', 'official'),
      page('https://docs.example.com/b', 'official'),
      page('https://docs.example.com/c', 'official'),
      page('https://example.net/d', 'third_party'),
      finished(3),
      started(5),
      runEvent('claim.verified', { claimId: 'steps.0.detail', url: 'https://docs.example.com/a' }),
      runEvent('claim.verified', { claimId: 'steps.1.detail', url: 'https://docs.example.com/b' }),
      runEvent('claim.downgraded', { claimId: 'limits.0', reason: 'quote_not_found' }),
    ])
    expect(result[2]?.summary).toBe('3 searches')
    expect(result[3]?.summary).toBe('4 pages read: 3 official, 1 third party')
    expect(result[5]?.summary).toBe('3 quotes checked: 2 matched, 1 downgraded')
  })

  it('uses the singular for one search, one page and one quote', () => {
    const result = groups([
      started(2), search('a'), started(3), page('https://docs.example.com/a', 'forum'),
      started(5), runEvent('claim.verified', { claimId: 'steps.0.detail', url: 'https://docs.example.com/a' }),
    ])
    expect(result[2]?.summary).toBe('1 search')
    expect(result[3]?.summary).toBe('1 page read: 1 forum')
    expect(result[5]?.summary).toBe('1 quote checked: 1 matched, 0 downgraded')
  })

  it('gives a stage with no events of its own no summary', () => {
    expect(groups([started(4), finished(4)])[4]?.summary).toBeNull()
  })

  it('gives a quote the tier of the page read at the same address, or none', () => {
    const result = groups([
      started(3), page('https://docs.example.com/a', 'official'),
      started(5),
      runEvent('claim.verified', { claimId: 'steps.0.detail', url: 'https://docs.example.com/a' }),
      runEvent('claim.verified', { claimId: 'steps.1.detail', url: 'https://docs.example.com/unseen' }),
    ])
    expect(result[5]?.items).toMatchObject([{ tier: 'official' }, { tier: null }])
  })

  it('adds one retry row to Search when it starts a second time, and keeps both passes together', () => {
    const result = groups([
      started(2), search('first'), finished(2),
      started(5), runEvent('claim.downgraded', { claimId: 'steps.0.detail', reason: 'quote_not_found' }), finished(5),
      started(2), search('second'),
    ])
    expect(result[2]?.items.map((item) => item.type)).toEqual(['search', 'retry', 'search'])
    expect(result[2]?.summary).toBe('2 searches')
  })

  it('keeps the reason code of a downgrade for the row to word', () => {
    const result = groups([started(5), runEvent('claim.downgraded', { claimId: 'limits.0', reason: 'time_budget' })])
    expect(result[5]?.items[0]).toMatchObject({ type: 'downgraded', claimId: 'limits.0', reason: 'time_budget' })
  })
})
