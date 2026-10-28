/**
 * File: looks-like-scope.ts
 * Purpose: Tells a scope string ("crm.objects.contacts.read", a URL) from a sentence that a guide stored as a scope name.
 *          Only a scope string is shown in mono with a copy button.
 * Exports: looksLikeScopeString
 * Used by: components/guide/ScopesTable.tsx
 */

const MAX_SCOPE_LENGTH = 200

/** A scope string has no whitespace. A sentence does. */
export function looksLikeScopeString(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_SCOPE_LENGTH && !/\s/.test(trimmed)
}
