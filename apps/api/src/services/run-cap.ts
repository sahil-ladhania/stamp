/**
 * File: run-cap.ts
 * Purpose: Daily cap on live runs, counted per UTC day, to keep demo costs bounded.
 * Exports: assertUnderRunCap
 * Used by: services/runs.ts
 */
import { RunCapReachedError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { startOfUtcDay } from "../utils/start-of-utc-day.js";

/**
 * Throws RunCapReachedError once `cap` runs have started today (any outcome counts).
 * Checked after the cache and join checks, so library and cached guides still work at the cap.
 * Two simultaneous starts can overshoot by one; the cap is a cost guard, not a ledger.
 */
export async function assertUnderRunCap(
  cap: number,
  now: Date = new Date(),
): Promise<void> {
  const startedToday = await prisma.run.count({
    where: { startedAt: { gte: startOfUtcDay(now) } },
  });
  if (startedToday >= cap) {
    throw new RunCapReachedError();
  }
}
