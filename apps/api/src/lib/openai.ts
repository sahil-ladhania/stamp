/**
 * File: openai.ts
 * Purpose: A structured-output model call with timeout, abort, token usage and classified failures.
 * Exports: structured, callStructured, StructuredResult, StructuredOptions
 * Used by: agent/nodes/plan.ts, agent/nodes/extract.ts, scripts/smoke-live.ts
 */
import type { z } from "zod";
import { TimeoutError } from "../utils/with-timeout.js";
import { logger } from "./logger.js";
import {
  ModelCallError,
  getModel,
  type ChatMessage,
  type ModelHandle,
  type ModelReply,
} from "./openai-client.js";
import {
  extractText,
  parseModelJson,
  readFinishReason,
  readTokenUsage,
  responseFormatFor,
} from "./openai-params.js";
import {
  recordModelCall,
  type ModelTier,
  type RunUsage,
  type TokenUsage,
} from "./usage.js";

export type StructuredOptions<S extends z.ZodType> = {
  schema: S;
  /** Names the response format and the call in logs (letters, digits, underscores). */
  name: string;
  messages: ChatMessage[];
  timeoutMs: number;
  signal?: AbortSignal;
  usage?: RunUsage;
  runId?: string;
};

type Timing = { model: string; durationMs: number; usage: TokenUsage };

/** A parsed reply, or a classified failure that still reports its token usage and the raw text for a repair. */
export type StructuredResult<T> =
  | ({ ok: true; data: T } & Timing)
  | ({
      ok: false;
      failure:
        "empty_response" | "truncated" | "invalid_json" | "schema_mismatch";
      message: string;
      raw: string;
    } & Timing);

function statusOf(err: unknown): number | undefined {
  const status =
    typeof err === "object" && err !== null
      ? Reflect.get(err, "status")
      : undefined;
  return typeof status === "number" ? status : undefined;
}

function classify<S extends z.ZodType>(
  reply: ModelReply,
  schema: S,
  timing: Timing,
): StructuredResult<z.infer<S>> {
  const raw = extractText(reply.content);
  if (raw.trim() === "") {
    // The library does not surface a refusal separately; an empty reply is the only sign of one.
    return {
      ok: false,
      failure: "empty_response",
      message: "The model returned no content",
      raw,
      ...timing,
    };
  }
  const parsed = parseModelJson(raw, schema);
  if (parsed.ok) {
    return { ok: true, data: parsed.data, ...timing };
  }
  const cutOff = readFinishReason(reply) === "length";
  const failure =
    cutOff && parsed.failure === "invalid_json" ? "truncated" : parsed.failure;
  const message =
    failure === "truncated"
      ? "The reply was cut off before the JSON was complete"
      : parsed.message;
  return { ok: false, failure, message, raw, ...timing };
}

/**
 * Runs one structured-output call and validates the reply with the full Zod schema.
 * A bad reply is returned as `ok: false` (tokens still counted); only timeouts, aborts and
 * API errors throw: the caller's abort reason, a TimeoutError, or a ModelCallError.
 */
export async function callStructured<S extends z.ZodType>(
  handle: ModelHandle,
  options: StructuredOptions<S>,
): Promise<StructuredResult<z.infer<S>>> {
  if (options.signal?.aborted) {
    // A cancelled run must not spend tokens on a call it can no longer use.
    throw options.signal.reason;
  }
  const started = Date.now();
  const deadline = AbortSignal.timeout(options.timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, deadline])
    : deadline;

  let reply: ModelReply;
  try {
    reply = await handle.chat.invoke(options.messages, {
      response_format: responseFormatFor(options.name, options.schema),
      signal,
    });
  } catch (err) {
    if (options.signal?.aborted) {
      throw options.signal.reason;
    }
    if (deadline.aborted) {
      throw new TimeoutError(`OpenAI ${options.name}`, options.timeoutMs);
    }
    throw new ModelCallError(handle.name, statusOf(err), { cause: err });
  }

  const usage = readTokenUsage(reply);
  if (options.usage) {
    recordModelCall(options.usage, handle.tier, usage);
  }
  const timing: Timing = {
    model: handle.name,
    durationMs: Date.now() - started,
    usage,
  };
  const result = classify(reply, options.schema, timing);
  logger.info("model call", {
    runId: options.runId,
    tier: handle.tier,
    model: handle.name,
    name: options.name,
    ok: result.ok,
    failure: result.ok ? undefined : result.failure,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    durationMs: timing.durationMs,
  });
  return result;
}

/** The structured call on the shared fast or strong model. */
export function structured<S extends z.ZodType>(
  tier: ModelTier,
  options: StructuredOptions<S>,
): Promise<StructuredResult<z.infer<S>>> {
  return callStructured(getModel(tier), options);
}
