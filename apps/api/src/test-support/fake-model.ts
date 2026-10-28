/**
 * File: fake-model.ts
 * Purpose: Fake chat models and shared options for testing callStructured without any network.
 * Exports: Schema, messages, usageMeta, callOptions, handleFor, replying, hangingHandle
 * Used by: lib/openai*.test.ts
 */
import { vi } from "vitest";
import { z } from "zod";
import type { ModelHandle, ModelReply } from "../lib/openai-client.js";

export const Schema = z.strictObject({ queries: z.array(z.string()).min(1) });
export const usageMeta = {
  input_tokens: 120,
  output_tokens: 30,
  total_tokens: 150,
};
export const messages = [
  { role: "system" as const, content: "Plan searches." },
  { role: "user" as const, content: "App: Notion" },
];
export const callOptions = {
  schema: Schema,
  name: "plan",
  messages,
  timeoutMs: 1000,
};

type Invoke = ModelHandle["chat"]["invoke"];

/** A handle whose model is the given invoke function. */
export function handleFor(
  invoke: Invoke,
  tier: ModelHandle["tier"] = "strong",
): ModelHandle {
  return { tier, name: `gpt-test-${tier}`, chat: { invoke } };
}

/** A handle whose model always returns the given reply. */
export function replying(
  reply: ModelReply,
  tier: ModelHandle["tier"] = "strong",
): ModelHandle {
  return handleFor(
    vi.fn<Invoke>(async () => reply),
    tier,
  );
}

/** A handle whose model never answers; it ends only when its signal aborts. */
export const hangingHandle: ModelHandle = handleFor(
  (_messages, { signal }) =>
    new Promise((_resolve, reject) => {
      if (signal.aborted) reject(signal.reason);
      signal.addEventListener("abort", () => reject(signal.reason));
    }),
);
