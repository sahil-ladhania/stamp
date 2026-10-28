/**
 * File: params.ts
 * Purpose: API-only Zod schemas for route params (not part of the shared wire contract).
 * Exports: SlugParamsSchema, RunIdParamsSchema
 * Used by: routes/guides.ts, routes/runs.ts, controllers
 */
import { z } from "zod";

// Only length is checked: an unknown slug or id is a 404, not a 400 (docs/api-design.md).
export const SlugParamsSchema = z.object({
  slug: z.string().min(1).max(100),
});

export const RunIdParamsSchema = z.object({
  id: z.string().min(1).max(64),
});
