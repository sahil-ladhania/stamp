/**
 * File: extract-node-helpers.ts
 * Purpose: Shared helpers for the extract stage tests: state builder, typed update accessors, an API-keys-only page, and all-unknown replies.
 * Exports: state, draftsOf, failureOf, useReplies, EMPTY, KEYS_URL, keysPage, keysGates
 * Used by: agent/nodes/extract*.test.ts
 */
import { vi } from "vitest";
import type { AgentFailure } from "../agent/agent-failure.js";
import type { Drafts } from "../agent/state.js";
import { structured } from "../lib/openai.js";
import { PAGES, claim } from "./extract-fixtures.js";
import { replyBySection } from "./extract-replies.js";
import { makeState } from "./graph-harness.js";
import { APP, pageRecord } from "./node-fixtures.js";

export const state = (
  pages = PAGES,
  extra: Partial<Parameters<typeof makeState>[0]> = {},
) => makeState({ app: APP, pages, ...extra });

/** The update's drafts and failure as plain values (LangGraph's update type also allows an overwrite wrapper). */
export const draftsOf = (update: { drafts?: unknown }) =>
  (update.drafts ?? {}) as Drafts;
export const failureOf = (update: { failure?: unknown }) =>
  update.failure as AgentFailure | null | undefined;

/** Makes the mocked `structured` answer by section, with these overrides (see replyBySection). */
export const useReplies = (overrides: Record<string, unknown> = {}) =>
  vi.mocked(structured).mockImplementation(replyBySection(overrides) as never);

/** Every section answering "unknown". */
export const EMPTY = {
  steps: { steps: [] },
  scopes: { scopes: [] },
  requirements: { requirements: [] },
  blockers: { blockers: [] },
  milestones: {
    firstTestEffort: null,
    firstTestWait: null,
    productionEffort: null,
    productionWait: null,
  },
  limits: { limits: [] },
  conflicts: { conflicts: [] },
  verdict: { summary: null, nextStepIndex: null, topBlockerIndex: null },
};

/** A page that says the app uses API keys and no OAuth, and gates facts the model might draw from it. */
export const KEYS_URL = "https://docs.acme.com/auth";
export const keysPage = pageRecord(
  KEYS_URL,
  "official",
  "Authenticate every request with an API key in the Authorization header. This API does not use OAuth and has no scopes or approval step.",
);
export const keysGates = {
  authMethod: "api_key_only",
  authEvidence: claim(
    KEYS_URL,
    "Authenticate every request with an API key in the Authorization header.",
  ),
  reviewGate: "unknown",
  reviewGateEvidence: null,
  approvalWait: "unknown",
  approvalWaitMinDays: null,
  approvalWaitMaxDays: null,
  approvalWaitEvidence: null,
  prerequisites: [],
  hiddenLimits: [],
  enterprisePlanEvidence: null,
};
