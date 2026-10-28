/**
 * File: tavily-client.ts
 * Purpose: The shared Tavily client and the request wrapper: timeout, abort, validation, call counting, safe errors.
 * Exports: getTavilyClient, request, parseOrThrow, cleanUrl, TavilyCallError, CallOptions
 * Used by: lib/tavily.ts
 */
import { tavily, type TavilyClient } from "@tavily/core";
import type { z } from "zod";
import { getConfig, requireRealAgentConfig } from "../config.js";
import { normalizeUrl } from "../utils/hash-url.js";
import { TimeoutError, withTimeout } from "../utils/with-timeout.js";
import { logger } from "./logger.js";
import { recordTavilyCall, type RunUsage } from "./usage.js";

export type CallOptions = {
  timeoutMs: number;
  signal?: AbortSignal;
  usage?: RunUsage;
  runId?: string;
};
/** A Tavily request that failed. Carries only a status: the axios error holds the Authorization header. */
export class TavilyCallError extends Error {
  readonly status: number | undefined;
  constructor(kind: "search" | "extract", status: number | undefined) {
    super(
      `Tavily ${kind} failed${status === undefined ? "" : ` (status ${status})`}`,
    );
    this.name = "TavilyCallError";
    this.status = status;
  }
}

let client: TavilyClient | undefined;

/** The shared Tavily client, created on first use so stub mode never needs a key. */
export function getTavilyClient(): TavilyClient {
  client ??= tavily({
    apiKey: requireRealAgentConfig(getConfig()).TAVILY_API_KEY,
  });
  return client;
}

/** The URL in normal form, or null when it is not a usable http(s) URL. */
export function cleanUrl(url: string): string | null {
  try {
    return normalizeUrl(url);
  } catch {
    return null;
  }
}

function statusOf(err: unknown): number | undefined {
  const response =
    typeof err === "object" && err !== null
      ? Reflect.get(err, "response")
      : undefined;
  const status =
    typeof response === "object" && response !== null
      ? Reflect.get(response, "status")
      : undefined;
  return typeof status === "number" ? status : undefined;
}

/** Runs one request under a timeout and the run's abort signal, counts it, and logs one line. */
export async function request<T extends { credits: number | null }>(
  kind: "search" | "extract",
  options: CallOptions,
  call: (timeoutSeconds: number) => Promise<unknown>,
  parse: (raw: unknown) => T,
): Promise<T> {
  if (options.signal?.aborted) {
    throw options.signal.reason;
  }
  const started = Date.now();
  let credits: number | null = null;
  let ok = false;
  try {
    // Tavily has no abort support, so its own timeout (seconds) ends the HTTP call soon after we give up.
    const timeoutSeconds = Math.max(1, Math.ceil(options.timeoutMs / 1000));
    const raw = await withTimeout(
      call(timeoutSeconds),
      options.timeoutMs,
      `Tavily ${kind}`,
      options.signal,
    );
    const result = parse(raw);
    credits = result.credits;
    ok = true;
    return result;
  } catch (err) {
    if (
      err instanceof TimeoutError ||
      options.signal?.aborted ||
      err instanceof TavilyCallError
    ) {
      throw options.signal?.aborted ? options.signal.reason : err;
    }
    throw new TavilyCallError(kind, statusOf(err));
  } finally {
    if (options.usage) {
      recordTavilyCall(options.usage, kind, credits);
    }
    logger.info("tavily call", {
      runId: options.runId,
      kind,
      ok,
      credits,
      durationMs: Date.now() - started,
    });
  }
}

/** Validates a response from the network; an unexpected shape is a failed call, not a crash later on. */
export function parseOrThrow<S extends z.ZodType>(
  kind: "search" | "extract",
  schema: S,
  raw: unknown,
): z.infer<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new TavilyCallError(kind, undefined);
  }
  return result.data;
}
