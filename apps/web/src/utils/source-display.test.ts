/**
 * File: source-display.test.ts
 * Purpose: Tests the domain, initial and short title made from a source URL.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { sourceDomain, sourceInitial, sourceShortTitle } from './source-display'

describe('sourceDomain', () => {
  it('drops www and keeps subdomains', () => {
    expect(sourceDomain('https://www.cloudsponge.com/blog/x')).toBe('cloudsponge.com')
    expect(sourceDomain('https://developers.google.com/a')).toBe('developers.google.com')
  })

  it('returns a string that is not a URL as it is', () => {
    expect(sourceDomain('not a url')).toBe('not a url')
  })
})

describe('sourceInitial', () => {
  it.each([
    ['https://developers.notion.com/guides', 'N'],
    ['https://www.cloudsponge.com/blog', 'C'],
    ['https://news.bbc.co.uk/story', 'B'],
    ['https://docs.cloud.google.com/x', 'G'],
  ])('reads %s as %s', (url, initial) => {
    expect(sourceInitial(url)).toBe(initial)
  })
})

describe('sourceShortTitle', () => {
  it.each([
    ['https://developers.google.com/workspace/add-ons/concepts/workspace-scopes', 'Workspace scopes'],
    ['https://developers.notion.com/guides/get-started/authorization', 'Authorization'],
    ['https://example.com/docs/setup_guide.html', 'Setup guide'],
    ['https://example.com/', ''],
    ['https://example.com/items/12345', ''],
  ])('reads %s as "%s"', (url, title) => {
    expect(sourceShortTitle(url)).toBe(title)
  })
})
