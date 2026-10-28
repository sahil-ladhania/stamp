/**
 * File: openai-params.test.ts
 * Purpose: Tests the temperature rule and the strict JSON Schema built from Zod schemas.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ExtractStepsOutputSchema } from "../agent/extraction.js";
import { PlanOutputSchema } from "../agent/plan-output.js";
import {
  modelSupportsTemperature,
  responseFormatFor,
  toOpenAiJsonSchema,
} from "./openai-params.js";

/** Every keyword that appears anywhere in a schema, ignoring property names. */
function keywordsIn(node: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(node)) node.forEach((child) => keywordsIn(child, found));
  else if (typeof node === "object" && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      if (key === "properties" || key === "$defs") {
        Object.values(value as object).forEach((child) =>
          keywordsIn(child, found),
        );
      } else {
        found.add(key);
        keywordsIn(value, found);
      }
    }
  }
  return found;
}

describe("modelSupportsTemperature", () => {
  it.each([
    "gpt-4.1-mini",
    "gpt-4.1",
    "gpt-4.1-nano",
    "gpt-4o",
    "gpt-4o-mini",
    "omni-moderation",
  ])("allows a temperature for %s", (model) =>
    expect(modelSupportsTemperature(model)).toBe(true),
  );

  it.each([
    "o1",
    "o3",
    "o3-mini",
    "o4-mini",
    "gpt-5",
    "gpt-5-mini",
    "GPT-5",
    "  o3  ",
  ])("omits the temperature for the reasoning model %s", (model) =>
    expect(modelSupportsTemperature(model)).toBe(false),
  );
});

describe("toOpenAiJsonSchema", () => {
  it("drops validation keywords from the existing extraction schemas but keeps the structure", () => {
    for (const schema of [PlanOutputSchema, ExtractStepsOutputSchema]) {
      const keywords = keywordsIn(toOpenAiJsonSchema(schema));
      for (const banned of [
        "$schema",
        "title",
        "format",
        "minLength",
        "minItems",
        "pattern",
        "default",
      ]) {
        expect(keywords.has(banned)).toBe(false);
      }
      expect(keywords.has("type")).toBe(true);
      expect(keywords.has("required")).toBe(true);
    }
  });

  it("keeps every object closed and fully required, so strict mode accepts it", () => {
    const json = JSON.stringify(toOpenAiJsonSchema(ExtractStepsOutputSchema));
    expect(json).toContain('"additionalProperties":false');
    expect(json).toContain('"enum":["agent","human","agent_assist"]');
  });

  it("keeps property names that look like keywords", () => {
    const schema = z.strictObject({
      format: z.string(),
      default: z.string(),
      title: z.string(),
      pattern: z.string(),
    });
    const json = toOpenAiJsonSchema(schema);
    expect(Object.keys(json.properties as object).sort()).toEqual([
      "default",
      "format",
      "pattern",
      "title",
    ]);
    expect(json.required).toEqual(["format", "default", "title", "pattern"]);
  });

  it("keeps nullable fields: a type list for primitives, anyOf for objects", () => {
    const json = toOpenAiJsonSchema(
      z.strictObject({
        contact: z.string().nullable(),
        claim: z.strictObject({ text: z.string() }).nullable(),
      }),
    );
    const props = json.properties as Record<string, Record<string, unknown>>;
    expect(props.contact).toEqual({ type: ["string", "null"] });
    expect(JSON.stringify(props.claim?.anyOf)).toContain('{"type":"null"}');
  });

  it("keeps every $ref pointing at a definition that exists", () => {
    const json = toOpenAiJsonSchema(ExtractStepsOutputSchema);
    const refs = [
      ...JSON.stringify(json).matchAll(/"\$ref":"#\/\$defs\/([^"]+)"/g),
    ].map((m) => m[1]);
    const defs = Object.keys((json.$defs ?? {}) as object);
    for (const ref of refs) expect(defs).toContain(ref);
  });

  it("throws at build time for an optional field, which strict mode would reject", () => {
    expect(() =>
      toOpenAiJsonSchema(z.strictObject({ note: z.string().optional() })),
    ).toThrow(/not strict-mode compatible at \$/);
  });

  it("names the nested path when a nested object is not strict", () => {
    const schema = z.strictObject({
      item: z.strictObject({ a: z.string(), b: z.string().optional() }),
    });
    expect(() => toOpenAiJsonSchema(schema)).toThrow(/\$\.item/);
  });
});

describe("responseFormatFor", () => {
  it("builds a strict json_schema response format", () => {
    const format = responseFormatFor("plan", PlanOutputSchema);
    expect(format.type).toBe("json_schema");
    expect(format.json_schema).toMatchObject({ name: "plan", strict: true });
    expect(format.json_schema.schema.type).toBe("object");
  });
});
