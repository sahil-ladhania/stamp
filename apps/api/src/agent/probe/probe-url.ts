/**
 * File: probe-url.ts
 * Purpose: Sends the one probe request, GET only, with every SSRF guard: https on 443, official domain, public IPs only, no redirects, no cookies, short timeout, 4 KB body.
 * Exports: probeUrl, buildProbeUrl, ProbeRun, ProbeIo, BODY_LIMIT_BYTES, DUMMY_CLIENT_ID
 * Used by: agent/nodes/probe.ts
 */
import { lookup } from "node:dns/promises";
import { withTimeout } from "../../utils/with-timeout.js";
import { evaluateResponse } from "./evaluate-response.js";
import { isPublicIp } from "./ip.js";
import { checkTarget } from "./target.js";

export const BODY_LIMIT_BYTES = 4_096;
export const DUMMY_CLIENT_ID = "stamp-probe-not-a-real-client";

/** `skipped`: a guard refused, nothing was sent. `failed`: sent, but the response did not confirm. */
export type ProbeRun = {
  outcome: "passed" | "failed" | "skipped";
  status: number | null;
  reason: string;
};

/** The network, injectable so tests never touch it. */
export type ProbeIo = {
  fetchFn: typeof fetch;
  lookupFn: (hostname: string) => Promise<string[]>;
};

const defaultIo: ProbeIo = {
  fetchFn: (input, init) => fetch(input, init),
  lookupFn: async (hostname) =>
    (await lookup(hostname, { all: true })).map((entry) => entry.address),
};

/** The authorize URL with a dummy client id and the code flow, so a real server answers with a client error. */
export function buildProbeUrl(target: URL): string {
  const url = new URL(target);
  url.hash = "";
  url.searchParams.set("client_id", DUMMY_CLIENT_ID);
  if (!url.searchParams.has("response_type")) {
    url.searchParams.set("response_type", "code");
  }
  return url.toString();
}

/** Reads at most BODY_LIMIT_BYTES of the body as text, then stops the download. */
async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < BODY_LIMIT_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  return new TextDecoder().decode(
    Buffer.concat(chunks).subarray(0, BODY_LIMIT_BYTES),
  );
}

/**
 * One GET to the authorize URL. Redirects are not followed (a 3xx is judged as it is), no cookies are
 * sent, and the host must resolve to public addresses only. Known limit: the name is resolved here and
 * again by fetch, so a hostile DNS server could answer differently the second time (DNS rebinding);
 * the domain guard (only the app's own domain) is what keeps that out of reach in practice.
 * Never throws except for an abort.
 */
export async function probeUrl(
  rawUrl: string,
  officialDomain: string,
  options: { timeoutMs: number; signal?: AbortSignal; io?: Partial<ProbeIo> },
): Promise<ProbeRun> {
  const { timeoutMs, signal } = options;
  const io = { ...defaultIo, ...options.io };
  const target = checkTarget(rawUrl, officialDomain);
  if (!target.ok) {
    return { outcome: "skipped", status: null, reason: target.reason };
  }
  try {
    const addresses = await withTimeout(
      io.lookupFn(target.url.hostname),
      timeoutMs,
      "probe dns lookup",
      signal,
    );
    if (addresses.length === 0 || !addresses.every(isPublicIp)) {
      return { outcome: "skipped", status: null, reason: "non_public_address" };
    }
    const requestUrl = buildProbeUrl(target.url);
    const response = await io.fetchFn(requestUrl, {
      method: "GET",
      redirect: "manual",
      credentials: "omit",
      headers: { accept: "text/html,application/json;q=0.9,*/*;q=0.5" },
      signal: AbortSignal.any([
        AbortSignal.timeout(timeoutMs),
        ...(signal ? [signal] : []),
      ]),
    });
    const body = await readCapped(response);
    const verdict = evaluateResponse(
      {
        status: response.status,
        body,
        location: response.headers.get("location"),
      },
      requestUrl,
      officialDomain,
    );
    return {
      outcome: verdict.passed ? "passed" : "failed",
      status: response.status,
      reason: verdict.reason,
    };
  } catch (err) {
    signal?.throwIfAborted();
    const timedOut =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    return {
      outcome: "failed",
      status: null,
      reason: timedOut ? "timeout" : "network_error",
    };
  }
}
