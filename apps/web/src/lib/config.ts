/**
 * File: config.ts
 * Purpose: Reads VITE_API_URL once and builds API URLs. It is empty in dev, where the Vite proxy serves /api.
 * Exports: resolveApiBaseUrl, API_BASE_URL, apiUrl
 * Used by: lib/api-client.ts, services/run-stream.service.ts
 */

/** Trims a trailing slash and rejects a value that is not an absolute URL. An unset value means same origin. */
export function resolveApiBaseUrl(raw: unknown): string {
  if (raw === undefined || raw === null) return ''
  if (typeof raw !== 'string') {
    throw new TypeError('VITE_API_URL must be a string')
  }
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (trimmed === '') return ''
  try {
    new URL(trimmed)
  } catch {
    throw new TypeError(`VITE_API_URL must be an absolute URL, got "${trimmed}"`)
  }
  return trimmed
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL)

/** Joins the base URL and an `/api/...` path. Used where Axios is not (the EventSource stream). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}
