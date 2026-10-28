/**
 * File: serve.ts
 * Purpose: Test helper that serves an Express app on an ephemeral port for fetch-based tests.
 * Exports: serve, TestServer
 * Used by: *.test.ts (app, middleware, routes)
 */
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";

export type TestServer = { url: string; close: () => Promise<void> };

/** Starts the app on a random free port; call `close` in afterEach/afterAll. */
export async function serve(app: Express): Promise<TestServer> {
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.closeAllConnections();
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
