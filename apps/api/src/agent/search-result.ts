/**
 * File: search-result.ts
 * Purpose: URLs returned from the search stage with source tier metadata.
 * Exports: SearchResultSchema, SearchResult
 * Used by: agent state, search node
 */
import { z } from "zod";
import { SourceTierSchema } from "@stamp/schema";

export const SearchResultSchema = z.strictObject({
  url: z.string().url(),
  tier: SourceTierSchema,
  title: z.string().optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;
