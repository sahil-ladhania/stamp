/**
 * File: run-mapper.ts
 * Purpose: Map Prisma Run rows to shared RunSnapshot schema.
 * Exports: toRunSnapshot
 * Used by: services/runs.ts
 */
import { RunErrorCodeSchema, RunSnapshotSchema, type RunSnapshot } from "@stamp/schema";
import type { Run as PrismaRun } from "../../generated/prisma/client.js";
import { toWireRunStatus } from "./enum-wire.js";

/** Converts a run row to the reconnect snapshot on the wire. */
export function toRunSnapshot(row: PrismaRun): RunSnapshot {
  const errorCode =
    row.errorCode === null || row.errorCode === undefined
      ? null
      : RunErrorCodeSchema.safeParse(row.errorCode).success
        ? RunErrorCodeSchema.parse(row.errorCode)
        : null;

  return RunSnapshotSchema.parse({
    runId: row.id,
    slug: row.slug,
    status: toWireRunStatus(row.status),
    stageReached: row.stageReached,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
    errorCode,
  });
}
