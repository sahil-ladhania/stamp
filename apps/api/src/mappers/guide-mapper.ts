/**
 * File: guide-mapper.ts
 * Purpose: Map Prisma Guide rows to shared Guide and GuideSummary schemas.
 * Exports: toGuide, toGuideSummary
 * Used by: services/guides.ts
 */
import {
  GuideSchema,
  GuideSummarySchema,
  type Guide,
  type GuideSummary,
} from "@stamp/schema";
import type { Guide as PrismaGuide } from "../../generated/prisma/client.js";
import { toWireArchetype, toWireGuideMode } from "./enum-wire.js";

/** Parses guides.data and overlays indexed columns so list metadata cannot drift. */
export function toGuide(row: PrismaGuide): Guide {
  const parsed = GuideSchema.parse(row.data);
  return GuideSchema.parse({
    ...parsed,
    slug: row.slug,
    appName: row.appName,
    domain: row.domain,
    mode: toWireGuideMode(row.mode),
    archetype: toWireArchetype(row.archetype),
    difficulty: row.difficulty,
    asOf: row.asOf.toISOString(),
  });
}

/** Maps a Prisma guide row to the home-page list item shape. */
export function toGuideSummary(row: PrismaGuide): GuideSummary {
  return GuideSummarySchema.parse({
    slug: row.slug,
    appName: row.appName,
    archetype: toWireArchetype(row.archetype),
    difficulty: row.difficulty,
    mode: toWireGuideMode(row.mode),
    asOf: row.asOf.toISOString(),
  });
}
