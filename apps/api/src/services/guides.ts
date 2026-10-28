/**
 * File: guides.ts
 * Purpose: Read library and live guides from storage.
 * Exports: listGuides, getGuideBySlug
 * Used by: controllers/guides.ts
 */
import type { Guide, GuideSummary } from "@stamp/schema";
import { InternalError } from "../errors/app-error.js";

/** Returns summaries for all library guides. */
export async function listGuides(): Promise<GuideSummary[]> {
  throw new InternalError();
}

/** Returns the full guide for a slug. */
export async function getGuideBySlug(_slug: string): Promise<Guide> {
  throw new InternalError();
}
