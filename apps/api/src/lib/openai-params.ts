/**
 * File: openai-params.ts
 * Purpose: Pure helpers for structured model calls: temperature rule, strict JSON Schema, reading and validating replies.
 * Exports: modelSupportsTemperature, toOpenAiJsonSchema, responseFormatFor, extractText, readTokenUsage, readFinishReason, parseModelJson, describeZodIssues, ResponseFormat
 * Used by: lib/openai.ts, scripts/smoke-live.ts
 */
import { z } from "zod";
import { ZERO_TOKENS, type TokenUsage } from "./usage.js";

export type ResponseFormat = {
  type: "json_schema";
  json_schema: { name: string; strict: true; schema: Record<string, unknown> };
};

// Reasoning families (o1, o3, o4-mini, gpt-5, ...) reject a non-default temperature.
const REASONING_MODEL = /^(o\d|gpt-5)/i;

/** False for reasoning model names; for those the temperature is omitted instead of sent. */
export function modelSupportsTemperature(model: string): boolean {
  return !REASONING_MODEL.test(model.trim());
}

// Validation keywords stay with Zod (we re-validate every reply); strict mode only needs the structure.
const STRIPPED_KEYWORDS = [
  "$schema",
  "title",
  "default",
  "examples",
  "format",
  "pattern",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minProperties",
  "maxProperties",
];

type Node = Record<string, unknown>;
const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Strips keywords from a schema node and recurses only into sub-schemas, never into property names. */
function sanitize(node: unknown, path: string): unknown {
  if (!isNode(node)) {
    return node;
  }
  const out: Node = {};
  for (const [key, value] of Object.entries(node)) {
    if (STRIPPED_KEYWORDS.includes(key)) {
      continue;
    }
    if (key === "properties" && isNode(value)) {
      out[key] = Object.fromEntries(
        Object.entries(value).map(([name, child]) => [
          name,
          sanitize(child, `${path}.${name}`),
        ]),
      );
    } else if ((key === "$defs" || key === "definitions") && isNode(value)) {
      out[key] = Object.fromEntries(
        Object.entries(value).map(([name, child]) => [
          name,
          sanitize(child, `${path}.${key}.${name}`),
        ]),
      );
    } else if (
      ["anyOf", "oneOf", "allOf", "prefixItems"].includes(key) &&
      Array.isArray(value)
    ) {
      out[key] = value.map((child, index) =>
        sanitize(child, `${path}.${key}[${index}]`),
      );
    } else if (key === "items" || key === "additionalProperties") {
      out[key] = sanitize(value, `${path}.${key}`);
    } else {
      out[key] = value;
    }
  }
  assertStrictObject(out, path);
  return out;
}

/** Strict mode needs every property required and no extra keys; an optional field would be rejected by the API. */
function assertStrictObject(node: Node, path: string): void {
  if (!isNode(node.properties)) {
    return;
  }
  const required = Array.isArray(node.required) ? node.required : [];
  const missing = Object.keys(node.properties).filter(
    (name) => !required.includes(name),
  );
  if (missing.length > 0 || node.additionalProperties !== false) {
    throw new Error(
      `Schema is not strict-mode compatible at ${path}: every property must be required (${missing.join(", ") || "ok"}) and additionalProperties must be false`,
    );
  }
}

/** The Zod schema as JSON Schema for OpenAI strict mode: structure only, constraints left to Zod. */
export function toOpenAiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const sanitized = sanitize(z.toJSONSchema(schema), "$");
  return isNode(sanitized) ? sanitized : {};
}

/** The `response_format` for a strict structured-output call. */
export function responseFormatFor(
  name: string,
  schema: z.ZodType,
): ResponseFormat {
  return {
    type: "json_schema",
    json_schema: { name, strict: true, schema: toOpenAiJsonSchema(schema) },
  };
}

/** Reply content as plain text: LangChain gives a string, or a list of parts with `text`. */
export function extractText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        isNode(part) && typeof part.text === "string" ? part.text : "",
      )
      .join("");
  }
  return "";
}

/** Token counts from a LangChain message; zeros when the API reported none. */
export function readTokenUsage(message: {
  usage_metadata?: unknown;
}): TokenUsage {
  const meta = message.usage_metadata;
  if (!isNode(meta)) {
    return { ...ZERO_TOKENS };
  }
  const count = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;
  const inputTokens = count(meta.input_tokens);
  const outputTokens = count(meta.output_tokens);
  const totalTokens = count(meta.total_tokens) || inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens };
}

/** The reply's finish reason ("stop", "length", ...), or undefined when not reported. */
export function readFinishReason(message: {
  response_metadata?: unknown;
}): string | undefined {
  const meta = message.response_metadata;
  const reason = isNode(meta) ? meta.finish_reason : undefined;
  return typeof reason === "string" ? reason : undefined;
}

/** Compact issue list for a repair prompt: paths and Zod messages only, never the offending values. */
export function describeZodIssues(error: z.ZodError, limit = 5): string {
  return error.issues
    .slice(0, limit)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

export type ParsedReply<T> =
  | { ok: true; data: T }
  | { ok: false; failure: "invalid_json" | "schema_mismatch"; message: string };

/** Parses the reply text as JSON and validates it with the full Zod schema. */
export function parseModelJson<S extends z.ZodType>(
  text: string,
  schema: S,
): ParsedReply<z.infer<S>> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      ok: false,
      failure: "invalid_json",
      message: "The reply is not valid JSON",
    };
  }
  const result = schema.safeParse(json);
  return result.success
    ? { ok: true, data: result.data }
    : {
        ok: false,
        failure: "schema_mismatch",
        message: describeZodIssues(result.error),
      };
}
