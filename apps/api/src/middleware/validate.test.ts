/**
 * File: validate.test.ts
 * Purpose: Tests request validation for body, params and query, and the typed reader.
 * Exports: (none)
 * Used by: vitest
 */
import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { serve, type TestServer } from "../test-support/serve.js";
import { errorHandler } from "./error-handler.js";
import { getValid, validate } from "./validate.js";

const BodySchema = z.strictObject({ app: z.string().min(2) });

let server: TestServer | undefined;

beforeEach(() => {
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  vi.restoreAllMocks();
});

async function start(): Promise<TestServer> {
  const app = express();
  app.use(express.json());
  app.post("/echo", validate(BodySchema, "body"), (_req, res) => {
    res.json(getValid(res, "body", BodySchema));
  });
  app.get(
    "/items/:id",
    validate(z.object({ id: z.string().regex(/^\d+$/) }), "params"),
    (_req, res) => {
      res.json({ ok: true });
    },
  );
  app.get("/unvalidated", (_req, res) => {
    res.json(getValid(res, "body", BodySchema));
  });
  app.use(errorHandler);
  server = await serve(app);
  return server;
}

function post(url: string, body: unknown): Promise<Response> {
  return fetch(`${url}/echo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("validate", () => {
  it("passes a valid body through to the handler", async () => {
    const { url } = await start();
    const response = await post(url, { app: "Notion" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ app: "Notion" });
  });

  it("rejects an invalid body with a 400 that names the field", async () => {
    const { url } = await start();
    const response = await post(url, { app: "a" });
    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("app");
  });

  it("rejects unknown body fields when the schema is strict", async () => {
    const { url } = await start();
    const response = await post(url, { app: "Notion", extra: true });
    expect(response.status).toBe(400);
  });

  it("validates route params", async () => {
    const { url } = await start();
    expect((await fetch(`${url}/items/12`)).status).toBe(200);
    expect((await fetch(`${url}/items/abc`)).status).toBe(400);
  });

  it("fails loudly when a route reads a value validate never stored", async () => {
    const { url } = await start();
    const response = await fetch(`${url}/unvalidated`);
    expect(response.status).toBe(500);
  });
});
