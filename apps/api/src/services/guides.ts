/**
 * File: guides.ts
 * Purpose: Read library and live guides from storage.
 * Exports: listGuides, getGuideBySlug
 * Used by: controllers/guides.ts
 */
import type { Guide, GuideSummary } from "@stamp/schema";
import { NotFoundError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { toPrismaGuideMode } from "../mappers/enum-wire.js";
import { toGuide, toGuideSummary } from "../mappers/guide-mapper.js";

/** Returns summaries of library guides, easiest first, for the home page. */
export async function listGuides(): Promise<GuideSummary[]> {
  const rows = await prisma.guide.findMany({
    where: { mode: toPrismaGuideMode("library") },
    orderBy: [{ difficulty: "asc" }, { appName: "asc" }],
    select: {
      slug: true,
      appName: true,
      archetype: true,
      difficulty: true,
      mode: true,
      asOf: true,
    },
  });
  return rows.map(toGuideSummary);
}

/** Returns the full guide for a slug; expired live guides stay readable so share links keep working. */
export async function getGuideBySlug(slug: string): Promise<Guide> {
  const row = await prisma.guide.findUnique({ where: { slug } });
  if (!row) {
    throw new NotFoundError("Guide not found.");
  }
  return toGuide(row);
}
