/**
 * File: runs.ts
 * Purpose: Binds run start, snapshot, and stream paths.
 * Exports: runsRouter
 * Used by: app.ts
 */
import { StartRunInputSchema } from "@stamp/schema";
import { Router } from "express";
import { createRun, getRun, streamRun } from "../controllers/runs.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validate } from "../middleware/validate.js";
import { RunIdParamsSchema } from "../schemas/params.js";

export const runsRouter: Router = Router();

const runIdParam = validate(RunIdParamsSchema, "params");

runsRouter.post(
  "/",
  validate(StartRunInputSchema, "body"),
  asyncHandler(createRun),
);
runsRouter.get("/:id", runIdParam, asyncHandler(getRun));
runsRouter.get("/:id/stream", runIdParam, asyncHandler(streamRun));
