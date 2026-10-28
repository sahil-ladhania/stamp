/**
 * File: errors.ts
 * Purpose: Shared API error response shape per docs/api-design.md.
 * Exports: ApiErrorBodySchema
 * Used by: apps/api error handler, apps/web
 */
import { z } from "zod";
import { ApiErrorCodeSchema } from "./enums.js";

export const ApiErrorBodySchema = z.strictObject({
  error: z.strictObject({
    code: ApiErrorCodeSchema,
    message: z.string().min(1),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
