/**
 * File: openai-reply.test.ts
 * Purpose: Tests reading a model reply: text, token usage, finish reason, JSON parsing and issue messages.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  describeZodIssues,
  extractText,
  parseModelJson,
  readFinishReason,
  readTokenUsage,
} from "./openai-params.js";

describe("extractText", () => {
  it("returns a string as is and joins text parts", () => {
    expect(extractText('{"a":1}')).toBe('{"a":1}');
    expect(
      extractText([
        { type: "text", text: "{" },
        { type: "image_url" },
        { type: "text", text: "}" },
      ]),
    ).toBe("{}");
  });

  it("returns an empty string for anything else", () => {
    for (const value of [null, undefined, 5, {}, [null, 3]])
      expect(extractText(value)).toBe("");
  });
});

describe("readTokenUsage and readFinishReason", () => {
  it("reads input, output and total tokens", () => {
    expect(
      readTokenUsage({
        usage_metadata: {
          input_tokens: 10,
          output_tokens: 4,
          total_tokens: 14,
        },
      }),
    ).toEqual({
      inputTokens: 10,
      outputTokens: 4,
      totalTokens: 14,
    });
  });

  it("derives the total when it is missing and returns zeros when nothing was reported", () => {
    expect(
      readTokenUsage({ usage_metadata: { input_tokens: 10, output_tokens: 4 } })
        .totalTokens,
    ).toBe(14);
    expect(readTokenUsage({})).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });
  });

  it("ignores values that are not finite numbers", () => {
    const usage = readTokenUsage({
      usage_metadata: {
        input_tokens: "7",
        output_tokens: Number.NaN,
        total_tokens: null,
      },
    });
    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });

  it("reads the finish reason when it is a string", () => {
    expect(
      readFinishReason({ response_metadata: { finish_reason: "length" } }),
    ).toBe("length");
    expect(
      readFinishReason({ response_metadata: { finish_reason: 3 } }),
    ).toBeUndefined();
    expect(readFinishReason({})).toBeUndefined();
  });
});

describe("parseModelJson and describeZodIssues", () => {
  const Schema = z.strictObject({ queries: z.array(z.string()).min(1) });

  it("parses a valid reply", () => {
    expect(parseModelJson('{"queries":["a"]}', Schema)).toEqual({
      ok: true,
      data: { queries: ["a"] },
    });
  });

  it("reports text that is not JSON", () => {
    expect(parseModelJson("Sure! Here you go", Schema)).toMatchObject({
      ok: false,
      failure: "invalid_json",
    });
  });

  it("reports a schema mismatch with paths and messages but never the offending values", () => {
    const result = parseModelJson(
      '{"queries":[],"secret":"sk-leaked"}',
      Schema,
    );
    expect(result).toMatchObject({ ok: false, failure: "schema_mismatch" });
    if (result.ok) return;
    expect(result.message).toContain("queries");
    expect(result.message).not.toContain("sk-leaked");
  });

  it("limits the number of issues described and names the root", () => {
    const many = z.strictObject({
      a: z.string(),
      b: z.string(),
      c: z.string(),
    });
    const parsed = many.safeParse(42);
    if (parsed.success) throw new Error("expected failure");
    expect(describeZodIssues(parsed.error)).toMatch(/^\(root\): /);
    const three = many.safeParse({});
    if (three.success) throw new Error("expected failure");
    expect(describeZodIssues(three.error, 2).split("; ")).toHaveLength(2);
  });
});
