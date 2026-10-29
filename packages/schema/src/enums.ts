/**
 * File: enums.ts
 * Purpose: Wire-format enums shared by web and API (lowercase snake_case domain values).
 * Exports: Zod enums and inferred types for labels, modes, tiers, status, errors
 * Used by: claim.ts, guide/*, api/*, events.ts, errors.ts
 */
import { z } from "zod";

export const EvidenceLabelSchema = z.enum(["tested", "sourced", "uncertain"]);
export type EvidenceLabel = z.infer<typeof EvidenceLabelSchema>;

export const ArchetypeSchema = z.enum([
  "instant",
  "hidden_limits",
  "review",
  "partner_gated",
  "enterprise",
  "unknown",
]);
export type Archetype = z.infer<typeof ArchetypeSchema>;

export const GuideModeSchema = z.enum(["library", "live"]);
export type GuideMode = z.infer<typeof GuideModeSchema>;

export const ActorSchema = z.enum(["agent", "human", "agent_assist"]);
export type Actor = z.infer<typeof ActorSchema>;

export const SourceTierSchema = z.enum(["official", "third_party", "forum"]);
export type SourceTier = z.infer<typeof SourceTierSchema>;

export const RunStatusSchema = z.enum([
  "running",
  "done",
  "partial",
  "failed",
]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const RunErrorCodeSchema = z.enum([
  "AMBIGUOUS_APP",
  "NOT_OAUTH",
  "NO_PUBLIC_DOCS",
  "INTERNAL",
]);
export type RunErrorCode = z.infer<typeof RunErrorCodeSchema>;

export const ApiErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "RATE_LIMITED",
  "RUN_CAP_REACHED",
  "INTERNAL",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const DowngradeReasonSchema = z.enum([
  "quote_not_found",
  "sources_disagree",
  "stale_source",
  "schema_failed",
  "time_budget",
  "off_product",
  "not_supported",
  "third_party_only",
]);
export type DowngradeReason = z.infer<typeof DowngradeReasonSchema>;

export const GuideCoverageSchema = z.enum(["full", "partial"]);
export type GuideCoverage = z.infer<typeof GuideCoverageSchema>;

export const StageIdSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
]);
export type StageId = z.infer<typeof StageIdSchema>;
