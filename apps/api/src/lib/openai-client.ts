/**
 * File: openai-client.ts
 * Purpose: Builds the two shared OpenAI chat models (fast and strong) behind a narrow interface.
 * Exports: createChat, getModel, ModelCallError, ChatMessage, ModelReply, StructuredChatModel, ModelHandle
 * Used by: lib/openai.ts, scripts/smoke-live.ts
 */
import { ChatOpenAI } from "@langchain/openai";
import { getConfig, requireRealAgentConfig } from "../config.js";
import {
  modelSupportsTemperature,
  type ResponseFormat,
} from "./openai-params.js";
import type { ModelTier } from "./usage.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ModelReply = {
  content: unknown;
  usage_metadata?: unknown;
  response_metadata?: unknown;
};

/** The one method the call helper needs from a chat model; ChatOpenAI satisfies it through createChat. */
export type StructuredChatModel = {
  invoke(
    messages: ChatMessage[],
    options: { response_format: ResponseFormat; signal: AbortSignal },
  ): Promise<ModelReply>;
};

export type ModelHandle = {
  tier: ModelTier;
  name: string;
  chat: StructuredChatModel;
};

/** A model call that failed outright (network, auth, rate limit); never carries the upstream message. */
export class ModelCallError extends Error {
  readonly status: number | undefined;
  constructor(
    model: string,
    status: number | undefined,
    options?: { cause: unknown },
  ) {
    super(
      `OpenAI call to ${model} failed${status === undefined ? "" : ` (status ${status})`}`,
      options,
    );
    this.name = "ModelCallError";
    this.status = status;
  }
}

type ChatSettings = { apiKey: string; model: string; fetch?: typeof fetch };

/** Builds a ChatOpenAI wrapped as a StructuredChatModel; temperature 0 unless the model is a reasoning model. */
export function createChat(settings: ChatSettings): StructuredChatModel {
  const chat = new ChatOpenAI({
    model: settings.model,
    apiKey: settings.apiKey,
    // One retry for a transient 429 or 5xx; the call deadline in openai.ts still bounds the total time.
    maxRetries: 1,
    ...(modelSupportsTemperature(settings.model) ? { temperature: 0 } : {}),
    ...(settings.fetch ? { configuration: { fetch: settings.fetch } } : {}),
  });
  return { invoke: (messages, options) => chat.invoke(messages, options) };
}

const handles = new Map<ModelTier, ModelHandle>();

/** The shared fast or strong model, created on first use so stub mode never needs a key. */
export function getModel(tier: ModelTier): ModelHandle {
  const existing = handles.get(tier);
  if (existing) {
    return existing;
  }
  const settings = requireRealAgentConfig(getConfig());
  const name =
    tier === "fast" ? settings.OPENAI_MODEL_FAST : settings.OPENAI_MODEL_STRONG;
  const handle: ModelHandle = {
    tier,
    name,
    chat: createChat({ apiKey: settings.OPENAI_API_KEY, model: name }),
  };
  handles.set(tier, handle);
  return handle;
}
