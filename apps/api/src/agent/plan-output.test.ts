/**
 * File: plan-output.test.ts
 * Purpose: Tests the plan output schema: unknown (null) is allowed per topic, and the shape fits OpenAI strict mode.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { toOpenAiJsonSchema } from "../lib/openai-params.js";
import { PlanOutputSchema, QUERY_TOPICS } from "./plan-output.js";

const allNull = Object.fromEntries(QUERY_TOPICS.map((topic) => [topic, null]));
const allText = Object.fromEntries(
  QUERY_TOPICS.map((topic) => [topic, `hubspot ${topic} query`]),
);

describe("PlanOutputSchema", () => {
  it("accepts a query for every topic", () => {
    expect(PlanOutputSchema.safeParse(allText).success).toBe(true);
  });

  it("accepts null for every topic: the model may say it does not know", () => {
    expect(PlanOutputSchema.safeParse(allNull).success).toBe(true);
  });

  it("accepts a mix of queries and unknowns", () => {
    expect(
      PlanOutputSchema.safeParse({ ...allText, scopes: null }).success,
    ).toBe(true);
  });

  it("rejects a missing topic", () => {
    const { setup: _setup, ...rest } = allText;
    expect(PlanOutputSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an extra key, so the model cannot add fields", () => {
    expect(
      PlanOutputSchema.safeParse({ ...allText, answer: "x" }).success,
    ).toBe(false);
  });

  it.each([42, ["a"], { text: "a" }])(
    "rejects a topic value of %j",
    (value) => {
      expect(
        PlanOutputSchema.safeParse({ ...allText, setup: value }).success,
      ).toBe(false);
    },
  );

  it("lists the six topics in run order", () => {
    expect(QUERY_TOPICS).toEqual([
      "setup",
      "scopes",
      "review",
      "limits",
      "authType",
      "approvalWait",
    ]);
  });

  it("converts to an OpenAI strict schema with every topic required and nullable", () => {
    const schema = toOpenAiJsonSchema(PlanOutputSchema);
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect([...(schema.required as string[])].sort()).toEqual(
      [...QUERY_TOPICS].sort(),
    );
  });
});
