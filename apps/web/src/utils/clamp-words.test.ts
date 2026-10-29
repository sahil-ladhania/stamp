/**
 * File: clamp-words.test.ts
 * Purpose: Tests that text is cut on word and clause boundaries, never mid-word.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { clampWords, clauseTitle } from './clamp-words'

describe('clampWords', () => {
  it('returns text that fits, with whitespace collapsed', () => {
    expect(clampWords('  A  short\nline ', 40)).toBe('A short line')
  })

  it('cuts at the last whole word and adds an ellipsis', () => {
    expect(clampWords('During testing the OAuth screen displays a strong warning page', 30)).toBe(
      'During testing the OAuth…',
    )
  })

  it('never ends inside a word', () => {
    const result = clampWords('discouraging most users from proceeding with the setup', 20)
    expect(result.endsWith('…')).toBe(true)
    expect('discouraging most users from proceeding with the setup'.startsWith(result.slice(0, -1))).toBe(true)
    expect(result.slice(0, -1).split(' ').every((word) => 'discouraging most users from proceeding with the setup'.split(' ').includes(word))).toBe(true)
  })

  it('drops trailing punctuation before the ellipsis', () => {
    expect(clampWords('First clause, second clause continues on', 14)).toBe('First clause…')
  })

  it('cuts a single very long word hard instead of overflowing', () => {
    expect(clampWords('x'.repeat(100), 10)).toBe(`${'x'.repeat(10)}…`)
  })
})

describe('clauseTitle', () => {
  it('keeps a short first sentence whole, without its full stop', () => {
    expect(clauseTitle("The developer sees an 'invalid_client' error. It is common.")).toBe(
      "The developer sees an 'invalid_client' error",
    )
  })

  it('cuts a long sentence at the last clause break that fits, as a complete phrase', () => {
    expect(
      clauseTitle(
        'During testing, the OAuth screen displays a strong warning page to users, discouraging most users from proceeding.',
      ),
    ).toBe('During testing, the OAuth screen displays a strong warning page to users')
  })

  it('does not cut at a clause break that is too early to be a useful title', () => {
    const title = clauseTitle(`Yes, ${'word '.repeat(40)}end.`, 60)
    expect(title.startsWith('Yes, word')).toBe(true)
    expect(title.endsWith('…')).toBe(true)
  })

  it('falls back to a word cut when there is no clause break', () => {
    const title = clauseTitle(`${'alpha '.repeat(30)}omega`, 50)
    expect(title.length).toBeLessThanOrEqual(51)
    expect(title.endsWith('…')).toBe(true)
  })

  it('is empty for blank text', () => {
    expect(clauseTitle('   ')).toBe('')
  })
})
