/**
 * File: source-tier.ts
 * Purpose: Display names for the three source tiers, so every page words them the same way.
 * Exports: TIER_LABEL, TIER_SHORT_LABEL
 * Used by: components/guide/ConflictCard.tsx, components/run/TraceRow.tsx
 */
import type { SourceTier } from "@stamp/schema";

/** The tag on a source chip, where the longer label would not fit. */
export const TIER_SHORT_LABEL: Record<SourceTier, string> = {
  official: "Official",
  third_party: "Third party",
  forum: "Forum",
};

export const TIER_LABEL: Record<SourceTier, string> = {
  official: "Official source",
  third_party: "Third-party source",
  forum: "Forum post",
};
