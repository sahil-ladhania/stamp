/**
 * File: guides.ts
 * Purpose: HTTP handlers for library list, guide read, and claim reports.
 * Exports: listGuides, getGuide, createReport
 * Used by: routes/guides.ts
 */
import { CreateClaimReportInputSchema } from "@stamp/schema";
import type { Request, Response } from "express";
import { getValid } from "../middleware/validate.js";
import { SlugParamsSchema } from "../schemas/params.js";
import * as guidesService from "../services/guides.js";
import * as reportsService from "../services/reports.js";

/** Lists library guides for the home page. */
export async function listGuides(_req: Request, res: Response): Promise<void> {
  res.json(await guidesService.listGuides());
}

/** Returns one guide by slug. */
export async function getGuide(_req: Request, res: Response): Promise<void> {
  const { slug } = getValid(res, "params", SlugParamsSchema);
  res.json(await guidesService.getGuideBySlug(slug));
}

/** Flags a wrong claim on a guide. */
export async function createReport(
  _req: Request,
  res: Response,
): Promise<void> {
  const { slug } = getValid(res, "params", SlugParamsSchema);
  const input = getValid(res, "body", CreateClaimReportInputSchema);
  const result = await reportsService.createClaimReport({ ...input, slug });
  res.status(201).json(result);
}
