/**
 * File: openai.test.ts
 * Purpose: Tests callStructured with fake models: success, request shape, usage, logging and classified failures.
 * Exports: (none)
 * Used by: vitest
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  callOptions as options,
  handleFor,
  messages,
  replying,
  usageMeta,
} from "../test-support/fake-model.js";
import type { ModelHandle } from "./openai-client.js";
import { callStructured } from "./openai.js";
import { createRunUsage } from "./usage.js";

let logged: string[];
beforeEach(() => {
  logged = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    logged.push(String(chunk));
    return true;
  });
});
afterEach(() => vi.restoreAllMocks());

describe("callStructured: success", () => {
  it("returns the parsed data with model, usage and duration", async () => {
    const result = await callStructured(
      replying({ content: '{"queries":["a","b"]}', usage_metadata: usageMeta }),
      options,
    );
    expect(result).toMatchObject({
      ok: true,
      data: { queries: ["a", "b"] },
      model: "gpt-test-strong",
      usage: { inputTokens: 120, outputTokens: 30, totalTokens: 150 },
    });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("sends the messages, a strict response format named after the call, and a signal", async () => {
    const invoke = vi.fn<ModelHandle["chat"]["invoke"]>(async () => ({
      content: '{"queries":["a"]}',
    }));
    await callStructured(handleFor(invoke), options);
    const [sentMessages, sentOptions] = invoke.mock.calls[0] ?? [];
    expect(sentMessages).toEqual(messages);
    expect(sentOptions?.response_format.json_schema).toMatchObject({
      name: "plan",
      strict: true,
    });
    expect(sentOptions?.signal).toBeInstanceOf(AbortSignal);
  });

  it("reads a reply whose content is a list of text parts", async () => {
    const result = await callStructured(
      replying({ content: [{ type: "text", text: '{"queries":["a"]}' }] }),
      options,
    );
    expect(result.ok).toBe(true);
  });

  it("records tokens on the run's meter under the model tier", async () => {
    const meter = createRunUsage();
    const reply = { content: '{"queries":["a"]}', usage_metadata: usageMeta };
    await callStructured(replying(reply, "fast"), { ...options, usage: meter });
    await callStructured(replying(reply, "strong"), {
      ...options,
      usage: meter,
    });
    expect(meter.models.fast).toMatchObject({ calls: 1, inputTokens: 120 });
    expect(meter.models.strong).toMatchObject({ calls: 1, outputTokens: 30 });
  });

  it("logs one line per call with the run id and token counts but never the prompt or reply", async () => {
    await callStructured(
      replying({
        content: '{"queries":["secret-query-text"]}',
        usage_metadata: usageMeta,
      }),
      { ...options, runId: "run_7" },
    );
    const line = logged.find((entry) => entry.includes('"model call"')) ?? "";
    expect(JSON.parse(line)).toMatchObject({
      runId: "run_7",
      tier: "strong",
      name: "plan",
      ok: true,
      inputTokens: 120,
    });
    expect(line).not.toContain("secret-query-text");
    expect(line).not.toContain("App: Notion");
  });
});

describe("callStructured: classified failures", () => {
  it("reports an empty reply, with its tokens counted", async () => {
    const meter = createRunUsage();
    const result = await callStructured(
      replying({ content: "", usage_metadata: usageMeta }),
      { ...options, usage: meter },
    );
    expect(result).toMatchObject({
      ok: false,
      failure: "empty_response",
      raw: "",
    });
    expect(meter.models.strong.calls).toBe(1);
  });

  it("reports text that is not JSON", async () => {
    const result = await callStructured(
      replying({ content: "I cannot do that" }),
      options,
    );
    expect(result).toMatchObject({
      ok: false,
      failure: "invalid_json",
      raw: "I cannot do that",
    });
  });

  it("reports a reply cut off by the token limit as truncated", async () => {
    const result = await callStructured(
      replying({
        content: '{"queries":["a",',
        response_metadata: { finish_reason: "length" },
      }),
      options,
    );
    expect(result).toMatchObject({ ok: false, failure: "truncated" });
  });

  it("reports valid JSON that breaks the schema, naming the path and returning the raw reply for a repair", async () => {
    const result = await callStructured(
      replying({ content: '{"queries":[]}', usage_metadata: usageMeta }),
      options,
    );
    expect(result).toMatchObject({
      ok: false,
      failure: "schema_mismatch",
      raw: '{"queries":[]}',
    });
    if (result.ok) return;
    expect(result.message).toContain("queries");
    expect(result.usage.totalTokens).toBe(150);
  });

  it("enforces constraints the model-facing schema does not carry", async () => {
    const Strict = z.strictObject({ url: z.string().url() });
    const result = await callStructured(
      replying({ content: '{"url":"not a url"}' }),
      { ...options, schema: Strict },
    );
    expect(result).toMatchObject({ ok: false, failure: "schema_mismatch" });
  });
});
