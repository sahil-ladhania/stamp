/**
 * File: guide-columns.ts
 * Purpose: Turns a guide into the columns of its `guides` row, with the indexed columns copied from the guide so they cannot drift from `data`.
 * Exports: toGuideColumns
 * Used by: services/guide-save.ts, services/library-seed.ts
 */
import { GuideSchema, type Guide, type GuideMode } from "@stamp/schema";
import { InternalError } from "../errors/app-error.js";
import { toPrismaArchetype, toPrismaGuideMode } from "../mappers/enum-wire.js";

/** Validates the guide with `mode` set, and returns its slug and every other column; `expiresAt` null never expires. */
export function toGuideColumns(
  guide: Guide,
  mode: GuideMode,
  expiresAt: Date | null,
) {
  const parsed = GuideSchema.parse({ ...guide, mode });
  const asOf = new Date(parsed.asOf);
  if (Number.isNaN(asOf.getTime())) {
    throw new InternalError();
  }
  return {
    slug: parsed.slug,
    fields: {
      appName: parsed.appName,
      domain: parsed.domain,
      mode: toPrismaGuideMode(mode),
      archetype: toPrismaArchetype(parsed.archetype),
      difficulty: parsed.difficulty,
      data: parsed,
      asOf,
      expiresAt,
    },
  };
}
