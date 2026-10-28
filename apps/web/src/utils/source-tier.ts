/**
 * File: source-tier.ts
 * Purpose: Display names for the two source tiers, so every page words them the same way.
 * Exports: TIER_LABEL
 * Used by: components/guide/ConflictCard.tsx, components/run/TraceRow.tsx
 */
import type { SourceTier } from "@/mocks/types";

export const TIER_LABEL: Record<SourceTier, string> = {
  official: "Official source",
  "third-party": "Third-party source",
};
