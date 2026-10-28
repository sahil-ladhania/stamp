/**
 * File: run-lock.ts
 * Purpose: Per-app run lock (runs.activeSlug is unique) plus the run-row updates that release it.
 * Exports: RUN_LOCK_STALE_MS, isStaleRun, acquireRunLock, findJoinableRun, failStaleRun, finishRun, recordStageReached, RunResult
 * Used by: services/runs.ts, services/run-view.ts, services/run-executor.ts
 */
import type { RunErrorCode, RunStatus } from "@stamp/schema";
import type { Run } from "../../generated/prisma/client.js";
import { InternalError } from "../errors/app-error.js";
import { logger } from "../lib/logger.js";
import { isUniqueViolation } from "../lib/prisma-errors.js";
import { prisma } from "../lib/prisma.js";
import { toPrismaRunStatus } from "../mappers/enum-wire.js";

/** A lock older than this belongs to a crashed run (a run lasts at most 135 seconds). */
export const RUN_LOCK_STALE_MS = 3 * 60_000;
const MAX_LOCK_ATTEMPTS = 3;

export type RunResult = {
  status: Exclude<RunStatus, "running">;
  stageReached: number | null;
  errorCode?: RunErrorCode;
  guideId?: string;
};

/** True for a run that is still marked running after the lock window. */
export function isStaleRun(
  run: Pick<Run, "status" | "startedAt">,
  now: Date = new Date(),
): boolean {
  return (
    run.status === "RUNNING" &&
    now.getTime() - run.startedAt.getTime() > RUN_LOCK_STALE_MS
  );
}

/** Fails a stale run and frees its slug; a no-op if the run finished in the meantime. */
export async function failStaleRun(run: Run): Promise<void> {
  const { count } = await prisma.run.updateMany({
    where: { id: run.id, status: "RUNNING" },
    data: {
      status: "FAILED",
      errorCode: "INTERNAL",
      activeSlug: null,
      finishedAt: new Date(),
    },
  });
  if (count > 0) {
    logger.warn("cleared stale run lock", { runId: run.id, slug: run.slug });
  }
}

/** The live run for a slug, or null; a stale one is failed first. */
export async function findJoinableRun(slug: string): Promise<Run | null> {
  const active = await prisma.run.findUnique({ where: { activeSlug: slug } });
  if (!active) {
    return null;
  }
  if (isStaleRun(active)) {
    await failStaleRun(active);
    return null;
  }
  return active;
}

/**
 * Takes the lock by inserting a run row; the unique activeSlug makes this atomic.
 * `isNew: false` means another request holds the lock and its run should be joined.
 */
export async function acquireRunLock(
  slug: string,
): Promise<{ run: Run; isNew: boolean }> {
  for (let attempt = 0; attempt < MAX_LOCK_ATTEMPTS; attempt += 1) {
    try {
      const run = await prisma.run.create({ data: { slug, activeSlug: slug } });
      return { run, isNew: true };
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }
    }
    const active = await findJoinableRun(slug);
    if (active) {
      return { run: active, isNew: false };
    }
  }
  throw new InternalError();
}

/** Records how a run ended and clears the lock in the same update. */
export async function finishRun(
  runId: string,
  result: RunResult,
): Promise<void> {
  await prisma.run.update({
    where: { id: runId },
    data: {
      status: toPrismaRunStatus(result.status),
      stageReached: result.stageReached,
      errorCode: result.errorCode ?? null,
      guideId: result.guideId ?? null,
      activeSlug: null,
      finishedAt: new Date(),
    },
  });
}

/** Keeps GET /api/runs/:id current while the run is in flight; a failed write is logged, not fatal. */
export async function recordStageReached(
  runId: string,
  stage: number,
): Promise<void> {
  try {
    await prisma.run.update({
      where: { id: runId },
      data: { stageReached: stage },
    });
  } catch (err) {
    logger.warn("could not record stage reached", {
      runId,
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
