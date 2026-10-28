/**
 * File: runs.ts
 * Purpose: HTTP handlers for starting runs, snapshots, and SSE streams.
 * Exports: createRun, getRun, streamRun
 * Used by: routes/runs.ts
 */
import { StartRunInputSchema } from "@stamp/schema";
import type { Request, Response } from "express";
import { getValid } from "../middleware/validate.js";
import { RunIdParamsSchema } from "../schemas/params.js";
import * as runsService from "../services/runs.js";
import {
  SSE_HEARTBEAT_MS,
  sendSseEvent,
  sendSseHeartbeat,
  startSse,
} from "../utils/sse.js";

/** 200 when a fresh guide exists; 202 when a run was started or joined. */
export async function createRun(_req: Request, res: Response): Promise<void> {
  const input = getValid(res, "body", StartRunInputSchema);
  const result = await runsService.startRun(input);
  res.status(result.status === "cached" ? 200 : 202).json(result);
}

/** Returns a run snapshot for reconnects. */
export async function getRun(_req: Request, res: Response): Promise<void> {
  const { id } = getValid(res, "params", RunIdParamsSchema);
  res.json(await runsService.getRunById(id));
}

/** Streams the run's snapshot and events as SSE until run.done or run.error, or the client leaves. */
export async function streamRun(_req: Request, res: Response): Promise<void> {
  const { id } = getValid(res, "params", RunIdParamsSchema);
  const clientGone = new AbortController();
  res.on("close", () => clientGone.abort());

  const events = runsService.openRunStream(id, clientGone.signal);
  // The first event is the snapshot; reading it first means an unknown run is a JSON 404, not a broken stream.
  let step = await events.next();
  startSse(res);
  const heartbeat = setInterval(() => sendSseHeartbeat(res), SSE_HEARTBEAT_MS);
  try {
    while (!step.done && !res.writableEnded && !res.destroyed) {
      sendSseEvent(res, step.value);
      step = await events.next();
    }
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
}
