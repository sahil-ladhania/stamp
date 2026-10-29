/**
 * File: difficulty-render.test.ts
 * Purpose: Renders the difficulty dots on the server to check what a reader sees: the number for a rated guide, "Not rated" and no number for one whose review gate is not verified.
 * Exports: (none)
 * Used by: vitest
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DifficultyDots } from './DifficultyDots'

const dots = (props: { isRated?: boolean }) =>
  renderToStaticMarkup(createElement(DifficultyDots, { score: 3, hasValue: true, ...props }))

describe('DifficultyDots', () => {
  it('shows five dots and the score for a rated guide, and by default', () => {
    for (const html of [dots({ isRated: true }), dots({})]) {
      expect(html).toContain('aria-label="Difficulty 3 of 5"')
      expect(html).toContain('3/5')
      expect(html.match(/rounded-full/g)).toHaveLength(5)
    }
  })

  it('says Not rated, with no dots and no number, when the review gate is not verified', () => {
    const html = dots({ isRated: false })
    expect(html).toContain('Not rated')
    expect(html).toContain('aria-label="Difficulty not rated"')
    expect(html).not.toContain('rounded-full')
    expect(html).not.toMatch(/\d\/5/)
  })
})
