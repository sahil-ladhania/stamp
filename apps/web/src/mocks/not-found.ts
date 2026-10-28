/**
 * File: not-found.ts
 * Purpose: The address the Not found page shows for each mock `?state=`, so every state can be reviewed.
 *          "Notion" is the example app name used in docs/api-design.md.
 * Exports: NOT_FOUND_MOCK_PATHS
 * Used by: pages/NotFoundPage.tsx
 */

export const NOT_FOUND_MOCK_PATHS = {
  suggestion: "/hubspot",
  "unknown-guide": "/g/notion",
} as const;
