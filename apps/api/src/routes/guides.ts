/**
 * File: guides.ts
 * Purpose: Binds guide list, read, and claim-report paths.
 * Exports: guidesRouter
 * Used by: app.ts
 */
import { Router } from "express";
import { createReport, getGuide, listGuides } from "../controllers/guides.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validate } from "../middleware/validate.js";
import { SlugParamsSchema } from "../schemas/params.js";

export const guidesRouter: Router = Router();

const slugParam = validate(SlugParamsSchema, "params");

guidesRouter.get("/", asyncHandler(listGuides));
guidesRouter.get("/:slug", slugParam, asyncHandler(getGuide));
guidesRouter.post("/:slug/reports", slugParam, asyncHandler(createReport));
