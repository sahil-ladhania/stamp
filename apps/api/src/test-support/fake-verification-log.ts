/**
 * File: fake-verification-log.ts
 * Purpose: In-memory stand-in for the Prisma verification_log table: createMany keeps the rows for assertions.
 * Exports: createFakeVerificationLog
 * Used by: test-support/fake-db.ts
 */
import { vi } from "vitest";

export type LogRow = {
  guideId: string;
  runId: string | null;
  claimId: string;
  method: "QUOTE_MATCH" | "PROBE" | "MANUAL" | "BROWSER";
  result: "PASS" | "FAIL";
  detail: string | null;
  sourceUrl: string | null;
};

export function createFakeVerificationLog() {
  const rows: LogRow[] = [];
  const delegate = {
    createMany: vi.fn(async ({ data }: { data: LogRow[] }) => {
      rows.push(...data);
      return { count: data.length };
    }),
  };
  return {
    rows,
    delegate,
    reset: (): void => {
      rows.length = 0;
      delegate.createMany.mockReset();
    },
  };
}
