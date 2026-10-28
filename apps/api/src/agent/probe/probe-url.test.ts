/**
 * File: probe-url.test.ts
 * Purpose: Tests the probe request with a mocked fetch and DNS: what is sent, each outcome, the body cap and the timeout.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { PUBLIC, URL1, io, reply, run } from "../../test-support/probe-io.js";
import {
  BODY_LIMIT_BYTES,
  DUMMY_CLIENT_ID,
  buildProbeUrl,
  probeUrl,
  type ProbeIo,
} from "./probe-url.js";

describe("buildProbeUrl", () => {
  it("adds a dummy client id and the code flow, and drops the fragment", () => {
    const url = new URL(buildProbeUrl(new URL(`${URL1}#top`)));
    expect(url.searchParams.get("client_id")).toBe(DUMMY_CLIENT_ID);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.hash).toBe("");
  });
  it("replaces a client id from the docs and keeps the response type it has", () => {
    const url = new URL(
      buildProbeUrl(
        new URL(`${URL1}?client_id=YOUR_ID&response_type=token&state=s`),
      ),
    );
    expect(url.searchParams.getAll("client_id")).toEqual([DUMMY_CLIENT_ID]);
    expect(url.searchParams.get("response_type")).toBe("token");
    expect(url.searchParams.get("state")).toBe("s");
  });
});

describe("probeUrl: the request", () => {
  it("sends one GET with the dummy client, manual redirects, no credentials and no cookie header", async () => {
    const rig = io();
    await run(rig);
    expect(rig.calls).toHaveBeenCalledTimes(1);
    const [url, init] = rig.calls.mock.calls[0] ?? [];
    expect(new URL(String(url)).searchParams.get("client_id")).toBe(
      DUMMY_CLIENT_ID,
    );
    expect(init).toMatchObject({
      method: "GET",
      redirect: "manual",
      credentials: "omit",
    });
    expect(
      Object.keys((init?.headers ?? {}) as object).map((h) => h.toLowerCase()),
    ).not.toContain("cookie");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("resolves the host once, by name", async () => {
    const rig = io();
    await run(rig);
    expect(rig.lookups).toHaveBeenCalledExactlyOnceWith("acme.com");
  });
});

describe("probeUrl: outcomes", () => {
  it.each([400, 401, 403])(
    "passes a %i that names the client",
    async (status) => {
      expect(
        await run(io(reply(status, '{"error":"invalid_client"}'))),
      ).toEqual({ outcome: "passed", status, reason: "client_rejected" });
    },
  );
  it("passes a redirect to a login page on the official domain, without following it", async () => {
    const rig = io(reply(302, "", { location: "https://acme.com/login" }));
    expect(await run(rig)).toEqual({
      outcome: "passed",
      status: 302,
      reason: "redirect_to_login",
    });
    expect(rig.calls).toHaveBeenCalledTimes(1);
  });
  it.each([
    [404, "not_found"],
    [500, "server_error"],
    [503, "server_error"],
    [200, "unexpected_status"],
  ])("fails a %i", async (status, reason) => {
    expect(await run(io(reply(status, "invalid_client")))).toEqual({
      outcome: "failed",
      status,
      reason,
    });
  });
  it("fails on a network error and says so", async () => {
    const rig = io(() => {
      throw new TypeError("fetch failed");
    });
    expect(await run(rig)).toEqual({
      outcome: "failed",
      status: null,
      reason: "network_error",
    });
  });
  it("fails on a timeout: a fetch that never answers is cut off at the limit", async () => {
    const hang = {
      fetchFn: ((_u: string, init?: RequestInit) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          ),
        )) as unknown as ProbeIo["fetchFn"],
      lookupFn: () => Promise.resolve(PUBLIC),
    };
    expect(
      await probeUrl(URL1, "acme.com", { timeoutMs: 20, io: hang }),
    ).toEqual({ outcome: "failed", status: null, reason: "timeout" });
  });
  it("lets an abort of the whole run through", async () => {
    const controller = new AbortController();
    controller.abort(new Error("run cancelled"));
    await expect(run(io(), URL1, 1_000, controller.signal)).rejects.toThrow(
      "run cancelled",
    );
  });
});

describe("probeUrl: body cap", () => {
  const big = (marker: string, at: number) => () =>
    new Response(`${"x".repeat(at)}${marker}${"y".repeat(100_000)}`, {
      status: 400,
    });
  it("sees a client error inside the first 4 KB", async () => {
    expect((await run(io(big("invalid_client", 100)))).outcome).toBe("passed");
  });
  it("does not read past 4 KB: a client error after the limit is not seen", async () => {
    expect(
      (await run(io(big("invalid_client", BODY_LIMIT_BYTES + 10)))).outcome,
    ).toBe("failed");
  });
  it("stops the download once it has enough", async () => {
    const cancelled = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(2_048).fill(120));
      },
      cancel: cancelled,
    });
    await run(io(() => new Response(stream, { status: 400 })));
    expect(cancelled).toHaveBeenCalled();
  });
});
