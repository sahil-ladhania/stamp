/**
 * File: page-record.ts
 * Purpose: In-memory fetched page used by verify and extract stages.
 * Exports: PageRecordSchema, PageRecord, PageCachePort
 * Used by: agent state, page-mapper.ts, fetch/load-pages.ts, deps.ts, evals/lib/fresh-page-cache.ts
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

/** Where fetched pages are kept between runs. The database cache is the default; evals pass one that never remembers. */
export type PageCachePort = {
  /** The page if a fresh copy is held, else null. */
  get: (url: string) => Promise<PageRecord | null>;
  /** Keeps a freshly fetched page and returns its record. */
  store: (input: {
    url: string;
    tier: z.infer<typeof SourceTierSchema>;
    text: string;
  }) => Promise<PageRecord>;
};
