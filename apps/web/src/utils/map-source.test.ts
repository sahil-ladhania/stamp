/**
 * File: map-source.test.ts
 * Purpose: Tests the source mapper: the title made from a URL, and the fields that pass through.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { mapSource, sourceTitle } from './map-source'

describe('sourceTitle', () => {
  it.each([
    ['https://docs.example.com/oauth/overview', 'docs.example.com/oauth/overview'],
    ['https://www.example.com/', 'example.com'],
    ['https://example.com/guide/', 'example.com/guide'],
    ['https://example.com/a?b=1#c', 'example.com/a'],
  ])('writes %s as %s', (url, title) => {
    expect(sourceTitle(url)).toBe(title)
  })

  it('cuts a long title with an ellipsis', () => {
    const title = sourceTitle(`https://example.com/${'a'.repeat(100)}`)
    expect(title).toHaveLength(60)
    expect(title.endsWith('…')).toBe(true)
  })

  it('returns a string that is not a URL as it is', () => {
    expect(sourceTitle('not a url')).toBe('not a url')
  })
})

describe('mapSource', () => {
  it('keeps the url, quote and tier and adds the title', () => {
    expect(
      mapSource({ url: 'https://forum.example.org/t/1', quote: 'Use v3.', tier: 'forum' }),
    ).toEqual({ url: 'https://forum.example.org/t/1', title: 'forum.example.org/t/1', tier: 'forum', quote: 'Use v3.' })
  })
})
