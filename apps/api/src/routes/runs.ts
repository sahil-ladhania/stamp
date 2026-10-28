/**
 * File: runs.ts
 * Purpose: Binds run start, snapshot, and stream paths.
 * Exports: runsRouter
 * Used by: lib/server.ts
 */
import { Router } from "express";
import { createRun, getRun, streamRun } from "../controllers/runs.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const runsRouter: Router = Router();

runsRouter.post("/", asyncHandler(createRun));
runsRouter.get("/:id", asyncHandler(getRun));
runsRouter.get("/:id/stream", asyncHandler(streamRun));