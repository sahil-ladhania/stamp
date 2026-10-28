/**
 * File: runs.ts
 * Purpose: Run lifecycle: cache lookup, join or start a run, and snapshots.
 * Exports: startRun, getRunById, openRunStream
 * Used by: controllers/runs.ts
 */
import type { RunSnapshot, StartRunInput, StartRunResult } from "@stamp/schema";
import { getConfig } from "../config.js";
import { ValidationError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { slugify } from "../utils/slugify.js";
import { assertUnderRunCap } from "./run-cap.js";
import { launchRun } from "./run-executor.js";
import { acquireRunLock, findJoinableRun } from "./run-lock.js";
import { loadRunView } from "./run-view.js";

export { openRunStream } from "./run-stream.js";

type CachedGuide = { mode: "LIBRARY" | "LIVE"; expiresAt: Date | null };

/** Library guides are curated: always a hit, even for `force`. A live guide is a hit until it expires. */
function isCacheHit(guide: CachedGuide, force: boolean, now: Date): boolean {
  if (guide.mode === "LIBRARY") {
    return true;
  }
  if (force) {
    return false;
  }
  return guide.expiresAt === null || guide.expiresAt > now;
}

/**
 * Returns a cached guide's slug, joins the run already researching this app, or starts a new one.
 * Order matters: cache, then join, then the daily cap, so cached and joined requests never hit the cap.
 */
export async function startRun(input: StartRunInput): Promise<StartRunResult> {
  const slug = slugify(input.app);
  if (!slug) {
    throw new ValidationError("app: Enter an app name or URL.");
  }

  const guide = await prisma.guide.findUnique({
    where: { slug },
    select: { mode: true, expiresAt: true },
  });
  if (guide && isCacheHit(guide, input.force === true, new Date())) {
    return { status: "cached", slug };
  }

  const active = await findJoinableRun(slug);
  if (active) {
    return { status: "running", runId: active.id };
  }

  await assertUnderRunCap(getConfig().DAILY_RUN_CAP);
  const lock = await acquireRunLock(slug);
  if (!lock.isNew) {
    return { status: "running", runId: lock.run.id };
  }
  launchRun({ id: lock.run.id, slug, app: input.app });
  return { status: "started", runId: lock.run.id };
}

/** Loads a run snapshot by id; 404 when unknown. */
export async function getRunById(runId: string): Promise<RunSnapshot> {
  return (await loadRunView(runId)).snapshot;
}
