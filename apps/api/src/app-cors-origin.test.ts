/**
 * File: app-cors-origin.test.ts
 * Purpose: Tests that WEB_ORIGIN pasted with a trailing slash still matches the browser's Origin header.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { serve, type TestServer } from "./test-support/serve.js";
import { testConfig } from "./test-support/test-config.js";

vi.mock("./lib/prisma.js", () => ({ prisma: {} }));
const { createApp } = await import("./app.js");

let server: TestServer | undefined;
afterEach(async () => {
  await server?.close();
  server = undefined;
});

describe("CORS and the WEB_ORIGIN setting", () => {
  it.each([
    "https://stamp.example.com",
    "https://stamp.example.com/",
    "https://stamp.example.com//",
  ])(
    "allows https://stamp.example.com when WEB_ORIGIN is %s",
    async (webOrigin) => {
      server = await serve(createApp({ ...testConfig, WEB_ORIGIN: webOrigin }));
      const response = await fetch(`${server.url}/api/health`, {
        headers: { Origin: "https://stamp.example.com" },
      });
      expect(response.headers.get("access-control-allow-origin")).toBe(
        "https://stamp.example.com",
      );
    },
  );

  it("does not allow another site", async () => {
    server = await serve(
      createApp({ ...testConfig, WEB_ORIGIN: "https://stamp.example.com/" }),
    );
    const response = await fetch(`${server.url}/api/health`, {
      headers: { Origin: "https://evil.example" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://stamp.example.com",
    );
  });
});
