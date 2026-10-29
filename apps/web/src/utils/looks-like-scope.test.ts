/**
 * File: looks-like-scope.test.ts
 * Purpose: Tests that scope strings and URLs count as scopes and sentences do not.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { looksLikeScopeString } from './looks-like-scope'

describe('looksLikeScopeString', () => {
  it.each([
    ['crm.objects.contacts.read'],
    ['https://www.googleapis.com/auth/gmail.readonly'],
    ['read:user'],
  ])('accepts %s', (text) => {
    expect(looksLikeScopeString(text)).toBe(true)
  })

  it.each([['Read open message metadata'], [''], ['   '], ['a'.repeat(300)]])('rejects "%s"', (text) => {
    expect(looksLikeScopeString(text)).toBe(false)
  })
})
