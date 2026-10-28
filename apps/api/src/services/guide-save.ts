/**
 * File: guide-save.ts
 * Purpose: The one function that writes a live guide; validates it, syncs indexed columns, protects library guides.
 * Exports: saveLiveGuide, LIVE_GUIDE_TTL_MS, SaveGuideResult
 * Used by: agent save stage (later)
 */
import { GuideSchema, type Guide } from "@stamp/schema";
import { InternalError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { toPrismaArchetype, toPrismaGuideMode } from "../mappers/enum-wire.js";

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
  const parsed = GuideSchema.parse({ ...guide, mode: "live" });
  const asOf = new Date(parsed.asOf);
  if (Number.isNaN(asOf.getTime())) {
    throw new InternalError();
  }

  const existing = await prisma.guide.findUnique({
    where: { slug: parsed.slug },
    select: { mode: true },
  });
  if (existing?.mode === toPrismaGuideMode("library")) {
    return { saved: false, reason: "library_guide_protected" };
  }

  const fields = {
    appName: parsed.appName,
    domain: parsed.domain,
    mode: toPrismaGuideMode("live"),
    archetype: toPrismaArchetype(parsed.archetype),
    difficulty: parsed.difficulty,
    data: parsed,
    asOf,
    expiresAt: new Date(now.getTime() + LIVE_GUIDE_TTL_MS),
  };
  await prisma.guide.upsert({
    where: { slug: parsed.slug },
    create: { slug: parsed.slug, ...fields },
    update: fields,
  });
  return { saved: true };
}
