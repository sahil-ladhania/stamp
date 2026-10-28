/**
 * File: guides.ts
 * Purpose: Binds guide list, read, and claim-report paths.
 * Exports: guidesRouter
 * Used by: lib/server.ts
 */
import { Router } from "express";
import {
  createReport,
  getGuide,
  listGuides,
} from "../controllers/guides.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const guidesRouter: Router = Router();

guidesRouter.get("/", asyncHandler(listGuides));
guidesRouter.get("/:slug", asyncHandler(getGuide));
guidesRouter.post("/:slug/reports", asyncHandler(createReport));
