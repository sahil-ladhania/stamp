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
  /** Tavily's relevance score, used to order results within a tier. */
  score: z.number().optional(),
  /** The planned topics whose queries returned this URL; absent when the result did not come from a planned query. */
  topics: z.array(z.string()).optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;
