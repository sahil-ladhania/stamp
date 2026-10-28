/**
 * File: excerpt.test.ts
 * Purpose: Tests the excerpt helper: short text is kept, long text is cut with an ellipsis, whitespace is collapsed.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { excerpt } from './excerpt'

describe('excerpt', () => {
  it('keeps a short text as it is', () => {
    expect(excerpt('Callback path is v3.1')).toBe('Callback path is v3.1')
  })

  it('cuts a long text at the limit with an ellipsis', () => {
    const result = excerpt('word '.repeat(30), 20)
    expect(result.length).toBeLessThanOrEqual(20)
    expect(result.endsWith('…')).toBe(true)
  })

  it('collapses newlines and repeated spaces', () => {
    expect(excerpt('one\n\n  two   three')).toBe('one two three')
  })

  it('is empty for blank text', () => {
    expect(excerpt('   ')).toBe('')
  })
})
