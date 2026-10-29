/**
 * File: extract-duration.test.ts
 * Purpose: Tests that stated durations are found as written and that nothing is guessed.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { extractDuration } from './extract-duration'

describe('extractDuration', () => {
  it.each([
    ['The review takes 3 to 7 days for approval.', '3 to 7 days'],
    ['You can see a page in under two minutes after starting.', 'under two minutes'],
    ['Allow about 1 hour for setup.', 'about 1 hour'],
    ['Approval needs 1-2 weeks.', '1-2 weeks'],
    ['It can take up to 5 business days.', 'up to 5 business days'],
    ['Setup is done in 10 minutes.', '10 minutes'],
  ])('finds the duration in "%s"', (text, duration) => {
    expect(extractDuration(text)).toBe(duration)
  })

  it.each([
    ['Not found in the fetched sources.'],
    ['To make a first test call, you need to configure the OAuth consent screen.'],
    ['There is no approval wait.'],
    ['Once a day the token refreshes.'],
    [''],
  ])('finds nothing in "%s"', (text) => {
    expect(extractDuration(text)).toBeNull()
  })
})
