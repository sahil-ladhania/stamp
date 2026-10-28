/**
 * File: run-view.ts
 * Purpose: Loads a run as a wire snapshot, failing stale runs on read, and derives its terminal event.
 * Exports: loadRunView, terminalEventFor, RunView
 * Used by: services/runs.ts, services/run-stream.ts
 */
import type { RunSnapshot, RunStreamEvent } from "@stamp/schema";
import { NotFoundError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { toRunSnapshot } from "../mappers/run-mapper.js";
import { RUN_ERROR_MESSAGES } from "./run-messages.js";
import { failStaleRun, isStaleRun } from "./run-lock.js";

export type RunView = {
  snapshot: RunSnapshot;
  /** Slug of the saved guide; can differ from the requested slug once the agent resolves the app. */
  guideSlug: string | null;
};

function findRunRow(runId: string) {
  return prisma.run.findUnique({
    where: { id: runId },
    include: { guide: { select: { slug: true } } },
  });
}

/** Reads a run; a run stuck in `running` past the lock window is failed first. */
export async function loadRunView(runId: string): Promise<RunView> {
  let row = await findRunRow(runId);
  if (!row) {
    throw new NotFoundError("Run not found.");
  }
  if (isStaleRun(row)) {
    await failStaleRun(row);
    row = (await findRunRow(runId)) ?? row;
  }
  return { snapshot: toRunSnapshot(row), guideSlug: row.guide?.slug ?? null };
}

/**
 * The run.done or run.error that ends this run's stream, rebuilt from the database.
 * Used when no in-memory buffer exists (after a restart or the retention window); null while running.
 */
export function terminalEventFor(view: RunView): RunStreamEvent | null {
  const { snapshot } = view;
  if (snapshot.status === "done" || snapshot.status === "partial") {
    return {
      type: "run.done",
      runId: snapshot.runId,
      slug: view.guideSlug ?? snapshot.slug,
      status: snapshot.status,
    };
  }
  if (snapshot.status === "failed") {
    const code = snapshot.errorCode ?? "INTERNAL";
    return {
      type: "run.error",
      runId: snapshot.runId,
      stage: snapshot.stageReached ?? 0,
      code,
      message: RUN_ERROR_MESSAGES[code],
    };
  }
  return null;
}
