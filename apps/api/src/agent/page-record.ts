/**
 * File: page-record.ts
 * Purpose: In-memory fetched page used by verify and extract stages.
 * Exports: PageRecordSchema, PageRecord
 * Used by: agent state, page-mapper.ts
 */
import { z } from "zod";
import { SourceTierSchema } from "@stamp/schema";

export const PageRecordSchema = z.strictObject({
  url: z.string().url(),
  urlHash: z.string().min(1),
  tier: SourceTierSchema,
  text: z.string(),
  contentHash: z.string().min(1),
  fetchedAt: z.string().min(1),
  expiresAt: z.string().min(1),
});
export type PageRecord = z.infer<typeof PageRecordSchema>;
