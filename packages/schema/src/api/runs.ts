/**
 * File: api/runs.ts
 * Purpose: Zod schemas for run start, snapshot, and status per docs/api-design.md.
 * Exports: StartRunInputSchema, StartRunResultSchema, RunSnapshotSchema
 * Used by: apps/api routes, apps/web lib/api.ts
 */
import { z } from "zod";
import { RunErrorCodeSchema, RunStatusSchema } from "../enums.js";

export const StartRunInputSchema = z.strictObject({
  app: z.string().min(2).max(100),
  force: z.boolean().optional(),
});
export type StartRunInput = z.infer<typeof StartRunInputSchema>;

const StartRunCachedSchema = z.strictObject({
  status: z.literal("cached"),
  slug: z.string().min(1),
});

const StartRunStartedSchema = z.strictObject({
  status: z.literal("started"),
  runId: z.string().min(1),
});

const StartRunRunningSchema = z.strictObject({
  status: z.literal("running"),
  runId: z.string().min(1),
});

export const StartRunResultSchema = z.discriminatedUnion("status", [
  StartRunCachedSchema,
  StartRunStartedSchema,
  StartRunRunningSchema,
]);
export type StartRunResult = z.infer<typeof StartRunResultSchema>;

export const RunSnapshotSchema = z.strictObject({
  runId: z.string().min(1),
  slug: z.string().min(1),
  status: RunStatusSchema,
  stageReached: z.number().int().min(0).max(8).nullable(),
  startedAt: z.string().min(1),
  finishedAt: z.string().min(1).nullable(),
  errorCode: RunErrorCodeSchema.nullable().optional(),
});
export type RunSnapshot = z.infer<typeof RunSnapshotSchema>;
