/**
 * File: site.test.ts
 * Purpose: Tests how the optional repository URL is read: unset, trimmed, and rejected when it is not an http URL.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { resolveRepoUrl } from './site'

describe('resolveRepoUrl', () => {
  it('is null when unset or blank, so the footer leaves the group out', () => {
    expect(resolveRepoUrl(undefined)).toBeNull()
    expect(resolveRepoUrl('')).toBeNull()
    expect(resolveRepoUrl('   ')).toBeNull()
  })

  it('keeps an https URL and trims a trailing slash', () => {
    expect(resolveRepoUrl(' https://github.com/sahil-ladhania/stamp/ ')).toBe('https://github.com/sahil-ladhania/stamp')
  })

  it('rejects a value that is not an absolute URL', () => {
    expect(() => resolveRepoUrl('github.com/x')).toThrow(/absolute URL/)
  })

  it('rejects a protocol other than http and https', () => {
    expect(() => resolveRepoUrl('javascript:alert(1)')).toThrow(/http/)
  })

  it('rejects a value that is not a string', () => {
    expect(() => resolveRepoUrl(42)).toThrow(/string/)
  })
})
