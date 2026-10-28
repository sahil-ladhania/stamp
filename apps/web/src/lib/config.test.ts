/**
 * File: config.test.ts
 * Purpose: Tests how VITE_API_URL is read: empty for the dev proxy, trimmed, and rejected when it is not a URL.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { apiUrl, resolveApiBaseUrl } from './config'

describe('resolveApiBaseUrl', () => {
  it('returns an empty string when the variable is unset, so the dev proxy serves /api', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('')
    expect(resolveApiBaseUrl('')).toBe('')
    expect(resolveApiBaseUrl('   ')).toBe('')
  })

  it('keeps an absolute URL as given', () => {
    expect(resolveApiBaseUrl('https://stamp-api.example.com')).toBe('https://stamp-api.example.com')
  })

  it('removes trailing slashes and surrounding spaces', () => {
    expect(resolveApiBaseUrl(' https://stamp-api.example.com// ')).toBe('https://stamp-api.example.com')
  })

  it('rejects a value that is not an absolute URL', () => {
    expect(() => resolveApiBaseUrl('stamp-api.example.com')).toThrow(/absolute URL/)
  })

  it('rejects a value that is not a string', () => {
    expect(() => resolveApiBaseUrl(3000)).toThrow(/string/)
  })
})

describe('apiUrl', () => {
  it('is the bare path in dev, where the base URL is empty', () => {
    expect(apiUrl('/api/health')).toBe('/api/health')
  })
})
