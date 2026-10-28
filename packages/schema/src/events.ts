/**
 * File: events.ts
 * Purpose: SSE run stream event payloads (discriminator field `type`).
 * Exports: RunStreamEventSchema and per-event schemas
 * Used by: apps/api streaming, apps/web useRunStream
 */
import { z } from "zod";
import {
  DowngradeReasonSchema,
  RunErrorCodeSchema,
  SourceTierSchema,
} from "./enums.js";
import { RunSnapshotSchema } from "./api/runs.js";

const RunStreamBaseSchema = z.strictObject({
  runId: z.string().min(1),
});

export const AppCandidateSchema = z.strictObject({
  name: z.string().min(1),
  domain: z.string().min(1),
});
export type AppCandidate = z.infer<typeof AppCandidateSchema>;

export const StageStartedEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("stage.started"),
  stage: z.number().int().min(0).max(8),
  name: z.string().min(1),
});

export const StageDoneEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("stage.done"),
  stage: z.number().int().min(0).max(8),
  durationMs: z.number().nonnegative(),
});

export const SearchQueryEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("search.query"),
  query: z.string().min(1),
});

export const PageFetchedEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("page.fetched"),
  url: z.string().url(),
  tier: SourceTierSchema,
});

export const ClaimVerifiedEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("claim.verified"),
  claimId: z.string().min(1),
  url: z.string().url(),
});

export const ClaimDowngradedEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("claim.downgraded"),
  claimId: z.string().min(1),
  reason: DowngradeReasonSchema,
});

export const RunDoneEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("run.done"),
  slug: z.string().min(1),
  status: z.enum(["done", "partial"]),
});

export const RunErrorEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("run.error"),
  stage: z.number().int().min(0).max(8),
  code: RunErrorCodeSchema,
  message: z.string().min(1),
  options: z.array(AppCandidateSchema).optional(),
});

export const RunSnapshotEventSchema = RunStreamBaseSchema.extend({
  type: z.literal("run.snapshot"),
  snapshot: RunSnapshotSchema,
});

export const RunStreamEventSchema = z.discriminatedUnion("type", [
  RunSnapshotEventSchema,
  StageStartedEventSchema,
  StageDoneEventSchema,
  SearchQueryEventSchema,
  PageFetchedEventSchema,
  ClaimVerifiedEventSchema,
  ClaimDowngradedEventSchema,
  RunDoneEventSchema,
  RunErrorEventSchema,
]);
export type RunStreamEvent = z.infer<typeof RunStreamEventSchema>;
