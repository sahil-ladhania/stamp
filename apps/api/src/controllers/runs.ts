/**
 * File: runs.ts
 * Purpose: HTTP handlers for starting runs, snapshots, and SSE streams.
 * Exports: createRun, getRun, streamRun
 * Used by: routes/runs.ts
 */
import type { Request, Response } from "express";
import { ValidationError } from "../errors/app-error.js";
import * as runsService from "../services/runs.js";
import { paramString } from "../utils/param-string.js";

/** Starts or joins a run, or returns a cached guide slug. */
export async function createRun(req: Request, _res: Response): Promise<void> {
  await runsService.startRun(req.body);
};

/** Returns a run snapshot for reconnects. */
export async function getRun(req: Request, _res: Response): Promise<void> {
  const runId = paramString(req.params.id);
  if (!runId) {
    throw new ValidationError("Run id is required.");
  }
  await runsService.getRunById(runId);
};

/** Opens an SSE stream for live run progress. */
export async function streamRun(req: Request, _res: Response): Promise<void> {
  const runId = paramString(req.params.id);
  if (!runId) {
    throw new ValidationError("Run id is required.");
  }
  void runsService.openRunStream(runId);
};