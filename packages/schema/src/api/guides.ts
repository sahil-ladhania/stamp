/**
 * File: api/guides.ts
 * Purpose: Zod schemas for claim report request and response bodies.
 * Exports: CreateClaimReportInputSchema, CreateClaimReportResultSchema
 * Used by: apps/api routes, apps/web
 */
import { z } from "zod";
import { ClaimIdSchema } from "../claim.js";

export const CreateClaimReportInputSchema = z.strictObject({
  claimId: ClaimIdSchema,
  note: z.string().max(2000).optional(),
});
export type CreateClaimReportInput = z.infer<
  typeof CreateClaimReportInputSchema
>;

export const CreateClaimReportResultSchema = z.strictObject({
  reportId: z.string().min(1),
});
export type CreateClaimReportResult = z.infer<
  typeof CreateClaimReportResultSchema
>;
