/**
 * File: verification-log.ts
 * Purpose: Writes the checks behind a guide's claims (quote matches and probes) to verification_log, with the page's content hash.
 * Exports: writeVerificationLog, CheckRecord
 * Used by: agent/nodes/save.ts
 */
import { prisma } from "../lib/prisma.js";

/** One check of one claim, kept so a quote can be traced to the exact page version it was checked against. */
export type CheckRecord = {
  claimId: string;
  method: "quote_match" | "probe";
  result: "pass" | "fail";
  /** Facts about the check, stored as JSON: the page's content hash, a reason, an HTTP status. */
  detail: { contentHash?: string; reason?: string; status?: number };
  sourceUrl: string | null;
};

const METHOD = { quote_match: "QUOTE_MATCH", probe: "PROBE" } as const;
const RESULT = { pass: "PASS", fail: "FAIL" } as const;

/**
 * Appends the checks for the guide stored under `slug`; returns how many rows were written.
 * Checks pile up across runs on purpose: each row says which run made it.
 */
export async function writeVerificationLog(input: {
  slug: string;
  runId: string;
  records: readonly CheckRecord[];
}): Promise<number> {
  if (input.records.length === 0) {
    return 0;
  }
  const guide = await prisma.guide.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (!guide) {
    return 0;
  }
  const written = await prisma.verificationLog.createMany({
    data: input.records.map((record) => ({
      guideId: guide.id,
      runId: input.runId,
      claimId: record.claimId,
      method: METHOD[record.method],
      result: RESULT[record.result],
      detail: JSON.stringify(record.detail),
      sourceUrl: record.sourceUrl,
    })),
  });
  return written.count;
}
