/**
 * File: param-string.ts
 * Purpose: Normalizes Express route params to a single string.
 * Exports: paramString
 * Used by: controllers/runs.ts, controllers/guides.ts
 */

/** Returns the first value when Express gives a string array for a param. */
export function paramString(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
};