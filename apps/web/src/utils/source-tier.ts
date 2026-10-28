/**
 * File: source-tier.ts
 * Purpose: Display names for the three source tiers, so every page words them the same way.
 * Exports: TIER_LABEL
 * Used by: components/guide/ConflictCard.tsx, components/run/TraceRow.tsx
 */
import type { SourceTier } from "@/mocks/types";

export const TIER_LABEL: Record<SourceTier, string> = {
  official: "Official source",
  third_party: "Third-party source",
  forum: "Forum post",
};
