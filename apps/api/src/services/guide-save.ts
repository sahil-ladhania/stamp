/**
 * File: guide-save.ts
 * Purpose: The one function that writes a live guide; validates it, syncs indexed columns, protects library guides.
 * Exports: saveLiveGuide, LIVE_GUIDE_TTL_MS, SaveGuideResult
 * Used by: agent/nodes/save.ts
 */
import type { Guide } from "@stamp/schema";
import { prisma } from "../lib/prisma.js";
import { toPrismaGuideMode } from "../mappers/enum-wire.js";
import { toGuideColumns } from "./guide-columns.js";

/** Live guides stay fresh for 7 days, then "Refresh" re-runs them. */
export const LIVE_GUIDE_TTL_MS = 7 * 24 * 60 * 60_000;

export type SaveGuideResult =
  { saved: true } | { saved: false; reason: "library_guide_protected" };

/**
 * Upserts a live guide by slug. A library guide with the same slug is never touched:
 * the caller gets `library_guide_protected` and should point the run at the library guide instead.
 */
export async function saveLiveGuide(
  guide: Guide,
  now: Date = new Date(),
): Promise<SaveGuideResult> {
  const { slug, fields } = toGuideColumns(
    guide,
    "live",
    new Date(now.getTime() + LIVE_GUIDE_TTL_MS),
  );

  const existing = await prisma.guide.findUnique({
    where: { slug },
    select: { mode: true },
  });
  if (existing?.mode === toPrismaGuideMode("library")) {
    return { saved: false, reason: "library_guide_protected" };
  }

  await prisma.guide.upsert({
    where: { slug },
    create: { slug, ...fields },
    update: fields,
  });
  return { saved: true };
}
