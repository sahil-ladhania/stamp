/**
 * File: glossary.ts
 * Purpose: Optional OAuth glossary entries on a guide (product copy, not provider claims).
 * Exports: GlossaryEntrySchema
 * Used by: guide/guide.ts
 */
import { z } from "zod";

export const GlossaryEntrySchema = z.strictObject({
  term: z.string().min(1),
  plain: z.string().min(1),
  composioTerm: z.string().min(1),
});
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;

export const GlossarySchema = z.array(GlossaryEntrySchema);
