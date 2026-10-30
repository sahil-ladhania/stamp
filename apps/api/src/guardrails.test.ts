/**
 * File: guardrails.test.ts
 * Purpose: HTTP-level tests for per-IP rate limiting on run starts and reports.
 * Exports: (none)
 * Used by: vitest
 */
import { ApiErrorBodySchema } from "@stamp/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleGuideRow } from "./mappers/fixtures/sample-guide-row.js";
import { serve, type TestServer } from "./test-support/serve.js";
import { testConfig } from "./test-support/test-config.js";
import type { EnvConfig } from "./config.js";

const prisma = vi.hoisted(() => ({
  guide: { findUnique: vi.fn(), findMany: vi.fn() },
  claimReport: { create: vi.fn() },
}));
vi.mock("./lib/prisma.js", () => ({ prisma }));

const { createApp } = await import("./app.js");

let server: TestServer | undefined;

beforeEach(() => {
  prisma.guide.findUnique.mockReset().mockResolvedValue(sampleGuideRow());
  prisma.guide.findMany.mockReset().mockResolvedValue([]);
  prisma.claimReport.create.mockReset().mockResolvedValue({ id: "rep_1" });
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  vi.restoreAllMocks();
});

async function start(overrides: Partial<EnvConfig> = {}): Promise<string> {
  const config = { ...testConfig, RATE_LIMIT_MAX: 2, ...overrides };
  server = await serve(createApp(config));
  return server.url;
}

function postRun(url: string, headers: Record<string, string> = {}) {
  return fetch(`${url}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ app: "Notion" }),
  });
}

function postReport(url: string) {
  return fetch(`${url}/api/guides/hubspot/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claimId: "verdict.summary" }),
  });
}

describe("rate limiting", () => {
  it("answers 429 RATE_LIMITED with Retry-After and CORS once the limit is hit", async () => {
    const url = await start();
    expect((await postRun(url)).status).not.toBe(429);
    expect((await postRun(url)).status).not.toBe(429);

    const limited = await postRun(url, { Origin: testConfig.WEB_ORIGIN });
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThanOrEqual(
      1,
    );
    expect(limited.headers.get("access-control-allow-origin")).toBe(
      testConfig.WEB_ORIGIN,
    );
    const body = ApiErrorBodySchema.parse(await limited.json());
    expect(body.error).toEqual({
      code: "RATE_LIMITED",
      message: "Too many runs. Try again in a minute.",
    });
  });

  it("limits reports separately from run starts", async () => {
    const url = await start();
    await postRun(url);
    await postRun(url);
    expect((await postRun(url)).status).toBe(429);

    expect((await postReport(url)).status).toBe(201);
    expect((await postReport(url)).status).toBe(201);
    const limited = await postReport(url);
    expect(limited.status).toBe(429);
    expect(ApiErrorBodySchema.parse(await limited.json()).error.message).toBe(
      "Too many reports. Try again in a minute.",
    );
  });

  it("does not limit reads", async () => {
    const url = await start();
    for (let i = 0; i < 5; i += 1) {
      expect((await fetch(`${url}/api/guides`)).status).toBe(200);
    }
  });

  it("ignores X-Forwarded-For when no proxy is trusted", async () => {
    const url = await start({ TRUST_PROXY_HOPS: 0 });
    await postRun(url, { "X-Forwarded-For": "1.1.1.1" });
    await postRun(url, { "X-Forwarded-For": "2.2.2.2" });
    const limited = await postRun(url, { "X-Forwarded-For": "3.3.3.3" });
    expect(limited.status).toBe(429);
  });

  it("counts each client IP separately behind one trusted proxy", async () => {
    const url = await start({ TRUST_PROXY_HOPS: 1 });
    await postRun(url, { "X-Forwarded-For": "1.1.1.1" });
    await postRun(url, { "X-Forwarded-For": "1.1.1.1" });
    expect((await postRun(url, { "X-Forwarded-For": "1.1.1.1" })).status).toBe(
      429,
    );
    expect(
      (await postRun(url, { "X-Forwarded-For": "2.2.2.2" })).status,
    ).not.toBe(429);
  });

  it("counts the address the one trusted proxy added, so a made-up first address cannot dodge the limit", async () => {
    const url = await start({ TRUST_PROXY_HOPS: 1 });
    // The proxy appends the real client address on the right; a client can only invent what is on the left.
    await postRun(url, { "X-Forwarded-For": "8.8.8.1, 5.5.5.5" });
    await postRun(url, { "X-Forwarded-For": "8.8.8.2, 5.5.5.5" });
    const limited = await postRun(url, {
      "X-Forwarded-For": "8.8.8.3, 5.5.5.5",
    });
    expect(limited.status).toBe(429);
    const other = await postRun(url, { "X-Forwarded-For": "8.8.8.1, 6.6.6.6" });
    expect(other.status).not.toBe(429);
  });

  it("with two trusted proxies the client is the second address from the right", async () => {
    const url = await start({ TRUST_PROXY_HOPS: 2 });
    await postRun(url, { "X-Forwarded-For": "7.7.7.7, 10.0.0.1" });
    await postRun(url, { "X-Forwarded-For": "7.7.7.7, 10.0.0.2" });
    expect(
      (await postRun(url, { "X-Forwarded-For": "7.7.7.7, 10.0.0.3" })).status,
    ).toBe(429);
    expect(
      (await postRun(url, { "X-Forwarded-For": "7.7.7.8, 10.0.0.3" })).status,
    ).not.toBe(429);
  });
});
