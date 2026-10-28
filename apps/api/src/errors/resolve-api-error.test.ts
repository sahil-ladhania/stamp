/**
 * File: resolve-api-error.test.ts
 * Purpose: Tests mapping from thrown values to API error responses.
 * Exports: (none)
 * Used by: vitest
 */
import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  InternalError,
  NotFoundError,
  RateLimitedError,
  RunCapReachedError,
  ValidationError,
} from "./app-error.js";
import { resolveApiError } from "./resolve-api-error.js";

describe("resolveApiError", () => {
  it("maps ValidationError to 400", () => {
    const resolved = resolveApiError(
      new ValidationError("Run id is required."),
    );
    expect(resolved.statusCode).toBe(400);
    expect(resolved.body).toEqual({
      error: { code: "VALIDATION_ERROR", message: "Run id is required." },
    });
  });

  it("maps NotFoundError to 404", () => {
    const resolved = resolveApiError(new NotFoundError());
    expect(resolved.statusCode).toBe(404);
    expect(resolved.body.error.code).toBe("NOT_FOUND");
  });

  it("maps RateLimitedError with Retry-After header", () => {
    const resolved = resolveApiError(
      new RateLimitedError("Too many runs. Try again in a minute.", 60),
    );
    expect(resolved.statusCode).toBe(429);
    expect(resolved.headers).toEqual({ "Retry-After": "60" });
  });

  it("maps RunCapReachedError to 503", () => {
    const resolved = resolveApiError(new RunCapReachedError());
    expect(resolved.statusCode).toBe(503);
    expect(resolved.body.error.code).toBe("RUN_CAP_REACHED");
  });

  it("maps ZodError to 400 with path detail", () => {
    const schema = z.object({ app: z.string().min(2) });
    const parsed = schema.safeParse({ app: "a" });
    if (parsed.success) {
      throw new Error("expected parse failure");
    }
    const resolved = resolveApiError(parsed.error);
    expect(resolved.statusCode).toBe(400);
    expect(resolved.body.error.code).toBe("VALIDATION_ERROR");
    expect(resolved.body.error.message).toContain("app");
  });

  it("maps SyntaxError to invalid JSON message", () => {
    const resolved = resolveApiError(new SyntaxError("Unexpected token"));
    expect(resolved.statusCode).toBe(400);
    expect(resolved.body.error.message).toBe(
      "Request body must be valid JSON.",
    );
  });

  it("maps unknown errors to 500 without leaking message", () => {
    const resolved = resolveApiError(new Error("database password leaked"));
    expect(resolved.statusCode).toBe(500);
    expect(resolved.body).toEqual({
      error: { code: "INTERNAL", message: "Something went wrong." },
    });
  });

  it("maps InternalError to 500", () => {
    const resolved = resolveApiError(new InternalError());
    expect(resolved.statusCode).toBe(500);
    expect(resolved.body.error.code).toBe("INTERNAL");
  });
});
