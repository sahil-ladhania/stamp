/**
 * File: reports.ts
 * Purpose: Persist reader-submitted wrong-claim reports.
 * Exports: createClaimReport
 * Used by: controllers/guides.ts
 */
import type {
  CreateClaimReportInput,
  CreateClaimReportResult,
} from "@stamp/schema";
import { NotFoundError, ValidationError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { toGuide } from "../mappers/guide-mapper.js";
import { collectGuideIds } from "../utils/collect-guide-ids.js";

type CreateClaimReportParams = CreateClaimReportInput & { slug: string };

/** Stores a report after checking the guide exists and contains the flagged claim id. */
export async function createClaimReport(
  input: CreateClaimReportParams,
): Promise<CreateClaimReportResult> {
  const row = await prisma.guide.findUnique({ where: { slug: input.slug } });
  if (!row) {
    throw new NotFoundError("Guide not found.");
  }
  // toGuide validates guides.data on read, so a corrupt row is a 500, never a stored report.
  if (!collectGuideIds(toGuide(row)).has(input.claimId)) {
    throw new ValidationError("claimId: no such claim in this guide.");
  }
  const note = input.note?.trim();
  const report = await prisma.claimReport.create({
    data: { guideId: row.id, claimId: input.claimId, note: note || null },
    select: { id: true },
  });
  return { reportId: report.id };
}
