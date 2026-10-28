/**
 * File: enum-wire.ts
 * Purpose: Convert Prisma uppercase enums to shared wire lowercase snake_case (and back).
 * Exports: toWire* and toPrisma* helpers per enum
 * Used by: guide-mapper.ts, run-mapper.ts, page-mapper.ts
 */
import type {
  Archetype as WireArchetype,
  GuideMode as WireGuideMode,
  RunStatus as WireRunStatus,
  SourceTier as WireSourceTier,
} from "@stamp/schema";
import type {
  Archetype as PrismaArchetype,
  GuideMode as PrismaGuideMode,
  RunStatus as PrismaRunStatus,
  SourceTier as PrismaSourceTier,
} from "../../generated/prisma/enums.js";

const GUIDE_MODE_TO_WIRE: Record<PrismaGuideMode, WireGuideMode> = {
  LIBRARY: "library",
  LIVE: "live",
};

const GUIDE_MODE_TO_PRISMA: Record<WireGuideMode, PrismaGuideMode> = {
  library: "LIBRARY",
  live: "LIVE",
};

const ARCHETYPE_TO_WIRE: Record<PrismaArchetype, WireArchetype> = {
  INSTANT: "instant",
  HIDDEN_LIMITS: "hidden_limits",
  REVIEW: "review",
  PARTNER_GATED: "partner_gated",
  ENTERPRISE: "enterprise",
  UNKNOWN: "unknown",
};

const ARCHETYPE_TO_PRISMA: Record<WireArchetype, PrismaArchetype> = {
  instant: "INSTANT",
  hidden_limits: "HIDDEN_LIMITS",
  review: "REVIEW",
  partner_gated: "PARTNER_GATED",
  enterprise: "ENTERPRISE",
  unknown: "UNKNOWN",
};

const RUN_STATUS_TO_WIRE: Record<PrismaRunStatus, WireRunStatus> = {
  RUNNING: "running",
  DONE: "done",
  PARTIAL: "partial",
  FAILED: "failed",
};

const RUN_STATUS_TO_PRISMA: Record<WireRunStatus, PrismaRunStatus> = {
  running: "RUNNING",
  done: "DONE",
  partial: "PARTIAL",
  failed: "FAILED",
};

const SOURCE_TIER_TO_WIRE: Record<PrismaSourceTier, WireSourceTier> = {
  OFFICIAL: "official",
  THIRD_PARTY: "third_party",
  FORUM: "forum",
};

const SOURCE_TIER_TO_PRISMA: Record<WireSourceTier, PrismaSourceTier> = {
  official: "OFFICIAL",
  third_party: "THIRD_PARTY",
  forum: "FORUM",
};

/** Maps Prisma GuideMode to wire format. */
export function toWireGuideMode(mode: PrismaGuideMode): WireGuideMode {
  return GUIDE_MODE_TO_WIRE[mode];
}

/** Maps wire GuideMode to Prisma. */
export function toPrismaGuideMode(mode: WireGuideMode): PrismaGuideMode {
  return GUIDE_MODE_TO_PRISMA[mode];
}

/** Maps Prisma Archetype to wire format. */
export function toWireArchetype(archetype: PrismaArchetype): WireArchetype {
  return ARCHETYPE_TO_WIRE[archetype];
}

/** Maps wire Archetype to Prisma. */
export function toPrismaArchetype(archetype: WireArchetype): PrismaArchetype {
  return ARCHETYPE_TO_PRISMA[archetype];
}

/** Maps Prisma RunStatus to wire format. */
export function toWireRunStatus(status: PrismaRunStatus): WireRunStatus {
  return RUN_STATUS_TO_WIRE[status];
}

/** Maps wire RunStatus to Prisma. */
export function toPrismaRunStatus(status: WireRunStatus): PrismaRunStatus {
  return RUN_STATUS_TO_PRISMA[status];
}

/** Maps Prisma SourceTier to wire format. */
export function toWireSourceTier(tier: PrismaSourceTier): WireSourceTier {
  return SOURCE_TIER_TO_WIRE[tier];
}

/** Maps wire SourceTier to Prisma. */
export function toPrismaSourceTier(tier: WireSourceTier): PrismaSourceTier {
  return SOURCE_TIER_TO_PRISMA[tier];
}
