/**
 * File: runs.ts
 * Purpose: HTTP handlers for starting runs, snapshots, and SSE streams.
 * Exports: createRun, getRun, streamRun
 * Used by: routes/runs.ts
 */
import type { Request, Response } from "express";
import { getValid } from "../middleware/validate.js";
import { RunIdParamsSchema } from "../schemas/params.js";
import * as runsService from "../services/runs.js";

/** Starts or joins a run, or returns a cached guide slug. */
export async function createRun(req: Request, _res: Response): Promise<void> {
  await runsService.startRun(req.body);
}

/** Returns a run snapshot for reconnects. */
export async function getRun(_req: Request, res: Response): Promise<void> {
  const { id } = getValid(res, "params", RunIdParamsSchema);
  await runsService.getRunById(id);
}

/** Opens an SSE stream for live run progress. */
export async function streamRun(_req: Request, res: Response): Promise<void> {
  const { id } = getValid(res, "params", RunIdParamsSchema);
  void runsService.openRunStream(id);
}
