/**
 * File: library-status.test.ts
 * Purpose: Tests how a library load result maps to a list state, including the empty library.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { getLibraryStatus } from './library-status'

describe('getLibraryStatus', () => {
  it('is loading while the request is in flight', () => {
    expect(getLibraryStatus({ isLoading: true, hasError: false, count: 0 })).toBe('loading')
  })

  it('is error when the request failed', () => {
    expect(getLibraryStatus({ isLoading: false, hasError: true, count: 0 })).toBe('error')
  })

  it('is empty, not error, when the library has no guides', () => {
    expect(getLibraryStatus({ isLoading: false, hasError: false, count: 0 })).toBe('empty')
  })

  it('is ready when there are guides', () => {
    expect(getLibraryStatus({ isLoading: false, hasError: false, count: 3 })).toBe('ready')
  })
})
