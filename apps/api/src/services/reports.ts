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
import { InternalError } from "../errors/app-error.js";

type CreateClaimReportParams = CreateClaimReportInput & { slug: string };

/** Stores a claim report for a guide slug. */
export async function createClaimReport(
  _input: CreateClaimReportParams,
): Promise<CreateClaimReportResult> {
  throw new InternalError();
}
