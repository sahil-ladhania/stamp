/**
 * File: app.test.ts
 * Purpose: HTTP-level tests for boot wiring: health, guides, CORS and the error contract.
 * Exports: (none)
 * Used by: vitest
 */
import {
  ApiErrorBodySchema,
  GuideSchema,
  GuideSummarySchema,
} from "@stamp/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleGuideRow } from "./mappers/fixtures/sample-guide-row.js";
import { serve, type TestServer } from "./test-support/serve.js";
import { testConfig } from "./test-support/test-config.js";

const guide = vi.hoisted(() => ({ findMany: vi.fn(), findUnique: vi.fn() }));
vi.mock("./lib/prisma.js", () => ({ prisma: { guide } }));

const { createApp } = await import("./app.js");

let server: TestServer;

beforeEach(async () => {
  guide.findMany.mockReset();
  guide.findUnique.mockReset();
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
  server = await serve(createApp(testConfig));
});

afterEach(async () => {
  await server.close();
  vi.restoreAllMocks();
});

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  const body = ApiErrorBodySchema.parse(await response.json());
  expect(body.error.code).toBe(code);
  return body;
}

describe("health", () => {
  it("answers GET /api/health with 200", async () => {
    const response = await fetch(`${server.url}/api/health`);
    expect(response.status).toBe(200);
  });
});

describe("GET /api/guides", () => {
  it("returns library guide summaries", async () => {
    guide.findMany.mockResolvedValue([sampleGuideRow()]);
    const response = await fetch(`${server.url}/api/guides`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as unknown[];
    expect(body.map((item) => GuideSummarySchema.parse(item))).toHaveLength(1);
  });
});

describe("GET /api/guides/:slug", () => {
  it("returns the full guide", async () => {
    guide.findUnique.mockResolvedValue(sampleGuideRow());
    const response = await fetch(`${server.url}/api/guides/hubspot`);
    expect(response.status).toBe(200);
    expect(GuideSchema.parse(await response.json()).slug).toBe("hubspot");
  });

  it("returns 404 NOT_FOUND for an unknown slug", async () => {
    guide.findUnique.mockResolvedValue(null);
    await expectError(
      await fetch(`${server.url}/api/guides/nope`),
      404,
      "NOT_FOUND",
    );
  });

  it("returns 500, not 400, when the stored guide JSON is corrupt", async () => {
    guide.findUnique.mockResolvedValue(sampleGuideRow({ data: { bad: true } }));
    const body = await expectError(
      await fetch(`${server.url}/api/guides/hubspot`),
      500,
      "INTERNAL",
    );
    expect(body.error.message).toBe("Something went wrong.");
  });

  it("hides database error text from the client", async () => {
    guide.findUnique.mockRejectedValue(new Error("password=hunter2"));
    const response = await fetch(`${server.url}/api/guides/hubspot`);
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(text).not.toContain("hunter2");
  });
});

describe("error contract", () => {
  it("returns a contract-shaped 404 for an unknown route", async () => {
    await expectError(await fetch(`${server.url}/api/nope`), 404, "NOT_FOUND");
  });

  it("returns 400 VALIDATION_ERROR for malformed JSON", async () => {
    const response = await fetch(`${server.url}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    await expectError(response, 400, "VALIDATION_ERROR");
  });

  it("returns 400 VALIDATION_ERROR for an oversized body", async () => {
    const response = await fetch(`${server.url}/api/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app: "x".repeat(20_000) }),
    });
    await expectError(response, 400, "VALIDATION_ERROR");
  });
});

describe("CORS", () => {
  it("allows the configured web origin", async () => {
    const response = await fetch(`${server.url}/api/health`, {
      headers: { Origin: testConfig.WEB_ORIGIN },
    });
    expect(response.headers.get("access-control-allow-origin")).toBe(
      testConfig.WEB_ORIGIN,
    );
    expect(response.headers.get("access-control-expose-headers")).toContain(
      "Retry-After",
    );
  });

  it("never echoes a different origin", async () => {
    const response = await fetch(`${server.url}/api/health`, {
      headers: { Origin: "https://evil.example" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBe(
      testConfig.WEB_ORIGIN,
    );
  });

  it("answers a preflight with 204 and the allowed methods", async () => {
    const response = await fetch(`${server.url}/api/runs`, {
      method: "OPTIONS",
      headers: {
        Origin: testConfig.WEB_ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toBe(
      "GET,POST",
    );
  });
});
