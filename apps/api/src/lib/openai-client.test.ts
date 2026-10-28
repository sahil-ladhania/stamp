/**
 * File: openai-client.test.ts
 * Purpose: Tests the real ChatOpenAI through a fake fetch (request body, auth, errors) and the model handles.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ModelCallError, createChat } from "./openai-client.js";
import { callStructured } from "./openai.js";

const config = vi.hoisted(() => ({
  AGENT_MODE: "real" as string,
  OPENAI_API_KEY: "sk-wire-secret",
  OPENAI_MODEL_FAST: "gpt-4.1-mini",
  OPENAI_MODEL_STRONG: "gpt-4.1",
  TAVILY_API_KEY: "tvly-x",
}));
vi.mock("../config.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../config.js")>()),
  getConfig: () => config,
}));

const Schema = z.strictObject({ queries: z.array(z.string()).min(1) });
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
const completion = (content: string) => ({
  id: "c1",
  object: "chat.completion",
  created: 1,
  model: "m",
  choices: [
    {
      index: 0,
      message: { role: "assistant", content },
      finish_reason: "stop",
    },
  ],
  usage: { prompt_tokens: 40, completion_tokens: 8, total_tokens: 48 },
});

type Seen = {
  url: string;
  body: Record<string, unknown>;
  headers: Headers;
  signal?: AbortSignal | null;
};
function fakeFetch(respond: () => Response) {
  const seen: Seen[] = [];
  const impl = vi.fn(
    async (url: string | URL | Request, init?: RequestInit) => {
      seen.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
        headers: new Headers(init?.headers),
        signal: init?.signal,
      });
      return respond();
    },
  ) as unknown as typeof fetch;
  return { impl, seen };
}
const run = (model: string, fetchImpl: typeof fetch) =>
  callStructured(
    {
      tier: "fast",
      name: model,
      chat: createChat({ apiKey: "sk-wire-secret", model, fetch: fetchImpl }),
    },
    {
      schema: Schema,
      name: "plan",
      messages: [
        { role: "system", content: "S" },
        { role: "user", content: "U" },
      ],
      timeoutMs: 2000,
    },
  );

describe("createChat over the wire", () => {
  it("sends a strict json_schema request with temperature 0 for a non-reasoning model", async () => {
    const { impl, seen } = fakeFetch(() =>
      json(completion('{"queries":["a"]}')),
    );
    const result = await run("gpt-4.1-mini", impl);
    expect(result).toMatchObject({
      ok: true,
      data: { queries: ["a"] },
      usage: { inputTokens: 40, outputTokens: 8, totalTokens: 48 },
    });
    const request = seen[0];
    expect(request?.url).toContain("/chat/completions");
    expect(request?.body).toMatchObject({
      model: "gpt-4.1-mini",
      temperature: 0,
    });
    expect(request?.body.response_format).toMatchObject({
      type: "json_schema",
      json_schema: { name: "plan", strict: true },
    });
    expect(request?.body.messages).toEqual([
      { role: "system", content: "S" },
      { role: "user", content: "U" },
    ]);
  });

  it("omits the temperature for a reasoning model name", async () => {
    const { impl, seen } = fakeFetch(() =>
      json(completion('{"queries":["a"]}')),
    );
    await run("o4-mini", impl);
    expect(seen[0]?.body).not.toHaveProperty("temperature");
  });

  it("sends the key only in the Authorization header, never in the body", async () => {
    const { impl, seen } = fakeFetch(() =>
      json(completion('{"queries":["a"]}')),
    );
    await run("gpt-4.1", impl);
    expect(seen[0]?.headers.get("authorization")).toBe("Bearer sk-wire-secret");
    expect(JSON.stringify(seen[0]?.body)).not.toContain("sk-wire-secret");
  });

  it("passes the abort signal down to the HTTP request", async () => {
    const hang = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          ),
        ),
    ) as unknown as typeof fetch;
    const controller = new AbortController();
    const pending = callStructured(
      {
        tier: "fast",
        name: "m",
        chat: createChat({ apiKey: "k", model: "gpt-4.1-mini", fetch: hang }),
      },
      {
        schema: Schema,
        name: "plan",
        messages: [],
        timeoutMs: 5000,
        signal: controller.signal,
      },
    );
    setTimeout(() => controller.abort(new Error("stop")), 10);
    await expect(pending).rejects.toThrow("stop");
  });

  it("maps a 401 to a ModelCallError with the status and without the upstream text", async () => {
    const { impl } = fakeFetch(() =>
      json(
        {
          error: {
            message: "Incorrect API key provided: sk-wire...cret",
            type: "invalid_request_error",
          },
        },
        401,
      ),
    );
    const error = await run("gpt-4.1", impl).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ModelCallError);
    expect(error).toMatchObject({ status: 401 });
    expect((error as Error).message).not.toContain("sk-wire");
  });
});

describe("getModel", () => {
  beforeEach(() => vi.resetModules());

  it("refuses to build a model when the agent settings are missing (stub mode)", async () => {
    const { getModel } = await import("./openai-client.js");
    const saved = { ...config };
    Object.assign(config, { OPENAI_API_KEY: undefined });
    expect(() => getModel("fast")).toThrow(
      "Missing agent settings: OPENAI_API_KEY",
    );
    Object.assign(config, saved);
  });

  it("builds the fast and strong models from the configured names and reuses them", async () => {
    const { getModel } = await import("./openai-client.js");
    const fast = getModel("fast");
    const strong = getModel("strong");
    expect([fast.name, strong.name]).toEqual(["gpt-4.1-mini", "gpt-4.1"]);
    expect([fast.tier, strong.tier]).toEqual(["fast", "strong"]);
    expect(getModel("fast")).toBe(fast);
    expect(getModel("strong")).toBe(strong);
  });
});
