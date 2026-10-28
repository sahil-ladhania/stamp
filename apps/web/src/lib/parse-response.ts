/**
 * File: parse-response.ts
 * Purpose: Validates an API reply with a shared @stamp/schema schema, or throws ApiError(INVALID_RESPONSE).
 * Exports: Parser, parseResponse
 * Used by: services/*
 */
import { ApiError } from './api-error'

/** Any Zod schema fits this shape, so the web app needs no direct dependency on zod. */
export type Parser<T> = {
  safeParse(
    data: unknown,
  ): { success: true; data: T } | { success: false; error: unknown }
}

/** Returns the typed value; a reply the schema rejects is a client-visible INVALID_RESPONSE. */
export function parseResponse<T>(schema: Parser<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError('INVALID_RESPONSE', 'The API reply did not match the shared schema.', {
      cause: result.error,
    })
  }
  return result.data
}
