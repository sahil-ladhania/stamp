/**
 * File: routes.ts
 * Purpose: Typed route params for React Router pages.
 * Exports: GuideRouteParams, RunRouteParams
 * Used by: pages under /g/:slug and /run/:id
 */

export type GuideRouteParams = {
  slug: string;
};

export type RunRouteParams = {
  runId: string;
};
