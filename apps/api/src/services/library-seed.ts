/**
 * File: library-seed.ts
 * Purpose: Writes checked library guides into the `guides` table as library rows that never expire. An upsert by slug, so seeding twice is safe; a live row with the same slug becomes the library guide.
 * Exports: seedLibraryGuides, SeedOutcome, SeedAction
 * Used by: scripts/db-seed.ts
 */
import type { Guide } from "@stamp/schema";
import { prisma } from "../lib/prisma.js";
import { toPrismaGuideMode } from "../mappers/enum-wire.js";
import { toGuideColumns } from "./guide-columns.js";

export type SeedAction = "created" | "updated" | "replaced_live";
export type SeedOutcome = { slug: string; action: SeedAction };

function actionFor(existing: { mode: string } | null): SeedAction {
  if (!existing) return "created";
  return existing.mode === toPrismaGuideMode("live")
    ? "replaced_live"
    : "updated";
}

/** Every guide is validated before the first write, so a bad one leaves the table as it was. Never deletes a row. */
export async function seedLibraryGuides(
  guides: readonly Guide[],
): Promise<SeedOutcome[]> {
  const rows = guides.map((guide) => toGuideColumns(guide, "library", null));
  const outcomes: SeedOutcome[] = [];
  for (const { slug, fields } of rows) {
    const existing = await prisma.guide.findUnique({
      where: { slug },
      select: { mode: true },
    });
    await prisma.guide.upsert({
      where: { slug },
      create: { slug, ...fields },
      update: fields,
    });
    outcomes.push({ slug, action: actionFor(existing) });
  }
  return outcomes;
}
