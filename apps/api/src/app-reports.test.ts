/**
 * File: app-reports.test.ts
 * Purpose: HTTP-level tests for POST /api/guides/:slug/reports.
 * Exports: (none)
 * Used by: vitest
 */
import {
  ApiErrorBodySchema,
  CreateClaimReportResultSchema,
} from "@stamp/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleGuideRow } from "./mappers/fixtures/sample-guide-row.js";
import { serve, type TestServer } from "./test-support/serve.js";
import { testConfig } from "./test-support/test-config.js";

const prisma = vi.hoisted(() => ({
  guide: { findUnique: vi.fn(), findMany: vi.fn() },
  claimReport: { create: vi.fn() },
}));
vi.mock("./lib/prisma.js", () => ({ prisma }));

const { createApp } = await import("./app.js");

let server: TestServer;

beforeEach(async () => {
  prisma.guide.findUnique.mockReset().mockResolvedValue(sampleGuideRow());
  prisma.claimReport.create.mockReset().mockResolvedValue({ id: "rep_1" });
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
  server = await serve(createApp(testConfig));
});

afterEach(async () => {
  await server.close();
  vi.restoreAllMocks();
});

function report(slug: string, body: unknown): Promise<Response> {
  return fetch(`${server.url}/api/guides/${slug}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(ApiErrorBodySchema.parse(await response.json()).error.code).toBe(code);
}

describe("POST /api/guides/:slug/reports", () => {
  it("returns 201 with the report id", async () => {
    const response = await report("hubspot", {
      claimId: "verdict.summary",
      note: "Callback path is v3.1 now",
    });
    expect(response.status).toBe(201);
    expect(CreateClaimReportResultSchema.parse(await response.json())).toEqual({
      reportId: "rep_1",
    });
  });

  it("returns 404 NOT_FOUND for an unknown guide", async () => {
    prisma.guide.findUnique.mockResolvedValue(null);
    await expectError(
      await report("nope", { claimId: "verdict.summary" }),
      404,
      "NOT_FOUND",
    );
  });

  it("returns 400 VALIDATION_ERROR for a claim the guide does not contain", async () => {
    await expectError(
      await report("hubspot", { claimId: "steps.99" }),
      400,
      "VALIDATION_ERROR",
    );
  });

  it("returns 400 VALIDATION_ERROR for a missing claimId", async () => {
    await expectError(await report("hubspot", {}), 400, "VALIDATION_ERROR");
  });

  it("returns 400 VALIDATION_ERROR for unknown fields and over-long notes", async () => {
    await expectError(
      await report("hubspot", { claimId: "verdict.summary", extra: 1 }),
      400,
      "VALIDATION_ERROR",
    );
    await expectError(
      await report("hubspot", {
        claimId: "verdict.summary",
        note: "x".repeat(2001),
      }),
      400,
      "VALIDATION_ERROR",
    );
  });
});
