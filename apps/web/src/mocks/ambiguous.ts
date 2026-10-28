/**
 * File: ambiguous.ts
 * Purpose: The "Did you mean" example for the App home `?state=ambiguous`: one query that matches two library apps.
 *          The options mirror the AMBIGUOUS_APP error in docs/api-design.md (`name` and `domain`); `slug` is a
 *          mock-only extra so a choice can open its library guide.
 * Exports: AMBIGUOUS_QUERY, AmbiguousOption, AMBIGUOUS_OPTIONS
 * Used by: components/app-home/LookupSection.tsx, components/app-home/AmbiguousOptions.tsx
 */

export const AMBIGUOUS_QUERY = "Hub";

export type AmbiguousOption = { name: string; domain: string; slug: string };

export const AMBIGUOUS_OPTIONS: readonly AmbiguousOption[] = [
  { name: "GitHub", domain: "github.com", slug: "github" },
  { name: "HubSpot", domain: "hubspot.com", slug: "hubspot" },
];
