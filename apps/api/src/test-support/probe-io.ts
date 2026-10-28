/**
 * File: probe-io.ts
 * Purpose: A fake network for the probe tests: a fetch that answers with a chosen response, a DNS lookup that returns chosen addresses, and shortcuts to run a probe.
 * Exports: URL1, PUBLIC, io, run, reply
 * Used by: agent/probe/probe-url*.test.ts
 */
import { vi } from "vitest";
import { probeUrl, type ProbeIo } from "../agent/probe/probe-url.js";

export const URL1 = "https://acme.com/oauth/authorize";
export const PUBLIC = ["93.184.216.34"];

export function io(
  response: () => Response | Promise<Response> = () =>
    new Response("{}", { status: 400 }),
  addresses: string[] = PUBLIC,
) {
  const fetchFn = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve(response()),
  );
  const lookupFn = vi.fn((_host: string) => Promise.resolve(addresses));
  return {
    fetchFn: fetchFn as unknown as ProbeIo["fetchFn"],
    lookupFn,
    calls: fetchFn,
    lookups: lookupFn,
  };
}
export const run = (
  rig: ReturnType<typeof io>,
  url = URL1,
  timeoutMs = 1_000,
  signal?: AbortSignal,
) => probeUrl(url, "acme.com", { timeoutMs, signal, io: rig });
export const reply =
  (status: number, body = "", headers: Record<string, string> = {}) =>
  (): Response =>
    new Response(body, { status, headers });
