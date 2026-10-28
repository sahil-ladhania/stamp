/**
 * File: run-launch.ts
 * Purpose: Test helper that launches a run like startRun does and waits for its last event.
 * Exports: runToEnd
 * Used by: services/run-executor*.test.ts
 */
import type { RunStreamEvent } from "@stamp/schema";
import { vi, expect } from "vitest";
import { getRunChannel } from "../services/run-events.js";
import { launchRun } from "../services/run-executor.js";
import { fakeDb } from "./fake-db.js";

/** Takes the lock, launches the run, and resolves once its terminal event is buffered. */
export async function runToEnd(): Promise<{
  id: string;
  events: RunStreamEvent[];
}> {
  const run = fakeDb.addRun({ slug: "notion", activeSlug: "notion" });
  launchRun({ id: run.id, slug: "notion", app: "Notion" });
  await vi.waitFor(() => expect(getRunChannel(run.id)?.isDone).toBe(true));
  return { id: run.id, events: getRunChannel(run.id)?.events ?? [] };
}
