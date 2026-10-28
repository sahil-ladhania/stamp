/**
 * File: reports.test.ts
 * Purpose: Tests claim report creation against a mocked Prisma client.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../errors/app-error.js";
import { sampleGuideRow } from "../mappers/fixtures/sample-guide-row.js";

const prisma = vi.hoisted(() => ({
  guide: { findUnique: vi.fn() },
  claimReport: { create: vi.fn() },
}));
vi.mock("../lib/prisma.js", () => ({ prisma }));

const { createClaimReport } = await import("./reports.js");

beforeEach(() => {
  prisma.guide.findUnique.mockReset();
  prisma.claimReport.create.mockReset();
  prisma.guide.findUnique.mockResolvedValue(sampleGuideRow());
  prisma.claimReport.create.mockResolvedValue({ id: "rep_1" });
});

describe("createClaimReport", () => {
  it("stores a trimmed note against the guide and returns the report id", async () => {
    const result = await createClaimReport({
      slug: "hubspot",
      claimId: "verdict.summary",
      note: "  Callback path is v3.1 now  ",
    });
    expect(result).toEqual({ reportId: "rep_1" });
    expect(prisma.claimReport.create).toHaveBeenCalledWith({
      data: {
        guideId: "guide_1",
        claimId: "verdict.summary",
        note: "Callback path is v3.1 now",
      },
      select: { id: true },
    });
  });

  it("stores no note when it is omitted or blank", async () => {
    await createClaimReport({ slug: "hubspot", claimId: "verdict.summary" });
    await createClaimReport({
      slug: "hubspot",
      claimId: "verdict.summary",
      note: "   ",
    });
    for (const call of prisma.claimReport.create.mock.calls) {
      expect(call[0].data.note).toBeNull();
    }
  });

  it("throws NotFoundError for an unknown guide and stores nothing", async () => {
    prisma.guide.findUnique.mockResolvedValue(null);
    await expect(
      createClaimReport({ slug: "nope", claimId: "verdict.summary" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(prisma.claimReport.create).not.toHaveBeenCalled();
  });

  it("throws ValidationError when the guide has no such claim", async () => {
    await expect(
      createClaimReport({ slug: "hubspot", claimId: "steps.99" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(prisma.claimReport.create).not.toHaveBeenCalled();
  });
});
