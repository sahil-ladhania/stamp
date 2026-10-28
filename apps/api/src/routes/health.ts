/**
 * File: health.ts
 * Purpose: Mounts GET / for liveness under /api/health.
 * Exports: healthRouter
 * Used by: lib/server.ts
 */
import { Router } from "express";
import { getHealth } from "../controllers/health.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const healthRouter: Router = Router();

healthRouter.get("/", asyncHandler(getHealth));
