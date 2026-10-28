/**
 * File: verification-log.test.ts
 * Purpose: Tests writing check records to verification_log: row shape, enum mapping, JSON detail with the content hash, and no-ops.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "../test-support/fake-db.js";
import type { CheckRecord } from "./verification-log.js";

vi.mock("../lib/prisma.js", async () => ({
  prisma: (await import("../test-support/fake-db.js")).fakeDb.prisma,
}));

const { writeVerificationLog } = await import("./verification-log.js");

const quote: CheckRecord = {
  claimId: "steps.0.detail",
  method: "quote_match",
  result: "pass",
  detail: { contentHash: "abc123" },
  sourceUrl: "https://docs.acme.com/oauth",
};
const probe: CheckRecord = {
  claimId: "steps.1.detail",
  method: "probe",
  result: "fail",
  detail: { status: 404, reason: "not_found" },
  sourceUrl: null,
};

beforeEach(() => {
  fakeDb.reset();
  fakeDb.addGuide({ slug: "acme", mode: "LIVE" });
});

describe("writeVerificationLog", () => {
  it("writes one row per record for the guide stored under the slug, and returns the count", async () => {
    expect(
      await writeVerificationLog({
        slug: "acme",
        runId: "run_1",
        records: [quote, probe],
      }),
    ).toBe(2);
    expect(fakeDb.verificationLog.rows).toHaveLength(2);
    expect(fakeDb.verificationLog.rows[0]).toMatchObject({
      guideId: "guide_acme",
      runId: "run_1",
      claimId: "steps.0.detail",
      sourceUrl: "https://docs.acme.com/oauth",
    });
  });

  it("maps the check method and result to the database enums", async () => {
    await writeVerificationLog({
      slug: "acme",
      runId: "run_1",
      records: [quote, probe],
    });
    expect(
      fakeDb.verificationLog.rows.map((r) => [r.method, r.result]),
    ).toEqual([
      ["QUOTE_MATCH", "PASS"],
      ["PROBE", "FAIL"],
    ]);
  });

  it("stores the detail as JSON that carries the page's content hash", async () => {
    await writeVerificationLog({
      slug: "acme",
      runId: "run_1",
      records: [quote, probe],
    });
    expect(JSON.parse(fakeDb.verificationLog.rows[0]?.detail ?? "")).toEqual({
      contentHash: "abc123",
    });
    expect(JSON.parse(fakeDb.verificationLog.rows[1]?.detail ?? "")).toEqual({
      status: 404,
      reason: "not_found",
    });
    expect(fakeDb.verificationLog.rows[1]?.sourceUrl).toBeNull();
  });

  it("keeps rows from earlier runs: it only appends", async () => {
    await writeVerificationLog({
      slug: "acme",
      runId: "run_1",
      records: [quote],
    });
    await writeVerificationLog({
      slug: "acme",
      runId: "run_2",
      records: [quote],
    });
    expect(fakeDb.verificationLog.rows.map((r) => r.runId)).toEqual([
      "run_1",
      "run_2",
    ]);
  });

  it("writes nothing, and queries nothing, for no records", async () => {
    expect(
      await writeVerificationLog({ slug: "acme", runId: "run_1", records: [] }),
    ).toBe(0);
    expect(fakeDb.prisma.guide.findUnique).not.toHaveBeenCalled();
  });

  it("writes nothing when no guide is stored under the slug", async () => {
    expect(
      await writeVerificationLog({
        slug: "missing",
        runId: "run_1",
        records: [quote],
      }),
    ).toBe(0);
    expect(fakeDb.verificationLog.rows).toEqual([]);
  });
});
