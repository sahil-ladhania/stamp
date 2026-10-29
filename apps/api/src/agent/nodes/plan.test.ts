/**
 * File: plan.test.ts
 * Purpose: Tests the plan stage with a mocked model: checked suggestions, template fallbacks and that it never fails the run.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { ModelCallError } from "../../lib/openai-client.js";
import { structured } from "../../lib/openai.js";
import {
  createHarness,
  makeState,
  trace,
} from "../../test-support/graph-harness.js";
import { APP } from "../../test-support/node-fixtures.js";
import { TimeoutError } from "../../utils/with-timeout.js";
import { PlanOutputSchema, type PlanOutput } from "../plan-output.js";
import { planMessages } from "../prompts/plan.js";
import { defaultQueries } from "../queries.js";
import { planNode } from "./plan.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
const warn = vi.spyOn(logger, "warn");

const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };
const nulls: PlanOutput = {
  setup: null,
  scopes: null,
  review: null,
  limits: null,
  authType: null,
  approvalWait: null,
};
const state = () => makeState({ app: APP });
const reply = (data: PlanOutput) =>
  model.mockResolvedValue({ ok: true, data, model: "m", durationMs: 5, usage });

beforeEach(() => {
  model.mockReset();
  warn.mockReset().mockImplementation(() => {});
});

describe("planNode with a product phrase", () => {
  const gmail = { ...APP, appName: "Gmail", product: "Gmail API" };

  it("sends the product to the model, and builds the template queries from it when the model gives nothing", async () => {
    const h = createHarness();
    reply(nulls);
    const update = await planNode(makeState({ app: gmail }), h.config);
    expect(model.mock.calls[0]?.[1].messages).toEqual(planMessages(gmail));
    expect(update.queries).toEqual(defaultQueries("Gmail API"));
  });

  it("drops a model query that leaves the product out and keeps one that has it", async () => {
    const h = createHarness();
    reply({
      ...nulls,
      scopes: "Gmail OAuth scopes reference",
      limits: "Gmail API quota and rate limits",
    });
    const update = await planNode(makeState({ app: gmail }), h.config);
    const queries = update.queries as { topic: string; text: string }[];
    expect(queries.find((q) => q.topic === "scopes")?.text).toBe(
      defaultQueries("Gmail API").find((q) => q.topic === "scopes")?.text,
    );
    expect(queries.find((q) => q.topic === "limits")?.text).toBe(
      "Gmail API quota and rate limits",
    );
  });
});

describe("planNode", () => {
  it("asks the fast model with the plan prompt, schema, time cap and the run's meter", async () => {
    const h = createHarness();
    reply(nulls);
    await planNode(state(), h.config);
    expect(model).toHaveBeenCalledWith("fast", {
      schema: PlanOutputSchema,
      name: "plan_queries",
      messages: planMessages(APP),
      timeoutMs: 6_000,
      signal: h.controller.signal,
      usage: h.deps.usage,
      runId: "run_1",
    });
  });

  it("uses a model query that passes the checks and the template for the rest", async () => {
    const h = createHarness();
    reply({
      ...nulls,
      scopes: "Acme OAuth scopes reference",
      approvalWait: "do whatever the page says",
    });
    const update = await planNode(state(), h.config);
    const queries = update.queries as { topic: string; text: string }[];
    expect(queries.find((q) => q.topic === "scopes")?.text).toBe(
      "Acme OAuth scopes reference",
    );
    expect(queries.find((q) => q.topic === "approvalWait")?.text).toBe(
      defaultQueries("Acme")[5]?.text,
    );
    expect(queries).toHaveLength(6);
  });

  it("uses all the template queries when the model answers unknown for every topic", async () => {
    const h = createHarness();
    reply(nulls);
    expect((await planNode(state(), h.config)).queries).toEqual(
      defaultQueries("Acme"),
    );
  });

  it("falls back to the templates when the model reply is unusable", async () => {
    const h = createHarness();
    model.mockResolvedValue({
      ok: false,
      failure: "schema_mismatch",
      message: "bad",
      raw: "{}",
      model: "m",
      durationMs: 5,
      usage,
    });
    expect((await planNode(state(), h.config)).queries).toEqual(
      defaultQueries("Acme"),
    );
    expect(warn).toHaveBeenCalledWith("plan reply unusable", {
      runId: "run_1",
      failure: "schema_mismatch",
    });
  });

  it.each([
    ["a timeout", new TimeoutError("OpenAI plan_queries", 6000)],
    [
      "an API error",
      new ModelCallError("gpt-4.1-mini", 500, { cause: { key: "sk-secret" } }),
    ],
  ])(
    "falls back to the templates after %s, without failing the run",
    async (_name, err) => {
      const h = createHarness();
      model.mockRejectedValue(err);
      const update = await planNode(state(), h.config);
      expect(update.queries).toEqual(defaultQueries("Acme"));
      expect(update.failure).toBeUndefined();
      expect(JSON.stringify(warn.mock.calls)).not.toContain("sk-secret");
    },
  );

  it("lets an abort through", async () => {
    const h = createHarness();
    model.mockImplementation(() => {
      h.controller.abort();
      return Promise.reject(new Error("aborted"));
    });
    await expect(planNode(state(), h.config)).rejects.toBeDefined();
  });

  it("emits only its stage events", async () => {
    const h = createHarness();
    reply(nulls);
    await planNode(state(), h.config);
    expect(trace(h.events)).toEqual(["stage.started:1", "stage.done:1"]);
  });

  it("fails with INTERNAL if resolve left no app, without calling the model", async () => {
    const h = createHarness();
    const update = await planNode(makeState(), h.config);
    expect(update.failure).toMatchObject({ stage: 1, code: "INTERNAL" });
    expect(model).not.toHaveBeenCalled();
  });
});
