/**
 * File: extract-replies.ts
 * Purpose: Valid model replies for all nine extraction sections, and a mock router that answers by section or returns a chosen reply.
 * Exports: STEPS_OUTPUT, LIMITS_OUTPUT, ALL_OUTPUTS, replyOk, replyBad, replyBySection and the other section outputs
 * Used by: agent/extract/*.test.ts, agent/nodes/extract*.test.ts
 */
import { OAUTH_URL, QUOTES, REVIEW_URL, claim } from "./extract-fixtures.js";

export const STEPS_OUTPUT = {
  steps: [
    {
      title: "Create the app",
      detail: claim(
        OAUTH_URL,
        QUOTES.secret,
        "Create an app and copy the client ID and secret.",
      ),
      actor: "human" as const,
      effort: null,
    },
  ],
};
export const LIMITS_OUTPUT = {
  limits: [
    claim(
      OAUTH_URL,
      QUOTES.cap,
      "Apps are capped at 25 installs until approved.",
    ),
  ],
};

const USAGE = { inputTokens: 1_000, outputTokens: 200, totalTokens: 1_200 };

/** A good structured reply, as the model client returns it. */
export function replyOk<T>(data: T) {
  return {
    ok: true as const,
    data,
    model: "gpt-4.1",
    durationMs: 800,
    usage: USAGE,
  };
}

/** A reply the client could not use: bad JSON or a schema mismatch, with the text so a repair can echo it. */
export function replyBad(
  failure: "invalid_json" | "schema_mismatch" | "empty_response" | "truncated",
  message: string,
  raw = "{}",
) {
  return {
    ok: false as const,
    failure,
    message,
    raw,
    model: "gpt-4.1",
    durationMs: 700,
    usage: { inputTokens: 900, outputTokens: 50, totalTokens: 950 },
  };
}

export const SCOPES_OUTPUT = {
  scopes: [
    {
      name: "contacts.read",
      reason: claim(OAUTH_URL, QUOTES.scope, "Lets an app read contacts."),
    },
  ],
};
export const REQUIREMENTS_OUTPUT = {
  requirements: [
    claim(REVIEW_URL, QUOTES.approval, "Apps over 25 installs need approval."),
  ],
};
export const BLOCKERS_OUTPUT = {
  blockers: [
    {
      symptom: claim(
        REVIEW_URL,
        QUOTES.approval,
        "Installs stop at 25 until approved.",
      ),
      cause: null,
      fix: null,
      contact: null,
    },
  ],
};
export const MILESTONES_OUTPUT = {
  firstTestEffort: claim(
    OAUTH_URL,
    QUOTES.secret,
    "Copy the client ID and secret.",
  ),
  firstTestWait: null,
  productionEffort: null,
  productionWait: claim(
    REVIEW_URL,
    QUOTES.review,
    "Review takes 5 to 7 business days.",
  ),
};
export const GATES_OUTPUT = {
  authMethod: "oauth" as const,
  authEvidence: claim(OAUTH_URL, QUOTES.secret),
  reviewGate: "required_to_scale" as const,
  reviewGateEvidence: claim(REVIEW_URL, QUOTES.approval),
  approvalWait: "range" as const,
  approvalWaitMinDays: 5,
  approvalWaitMaxDays: 7,
  approvalWaitEvidence: claim(REVIEW_URL, QUOTES.review),
  prerequisites: [
    claim(
      REVIEW_URL,
      "Enterprise accounts can skip the install cap by contacting support.",
    ),
  ],
  hiddenLimits: [claim(OAUTH_URL, QUOTES.cap)],
  enterprisePlanEvidence: null,
};
export const VERDICT_OUTPUT = {
  summary: claim(
    OAUTH_URL,
    QUOTES.secret,
    "Setup is simple but approval gates growth.",
  ),
  nextStepIndex: 0,
  topBlockerIndex: 0,
};

/** A valid reply for each of the nine sections. */
export const ALL_OUTPUTS: Record<string, unknown> = {
  steps: STEPS_OUTPUT,
  scopes: SCOPES_OUTPUT,
  requirements: REQUIREMENTS_OUTPUT,
  blockers: BLOCKERS_OUTPUT,
  milestones: MILESTONES_OUTPUT,
  gates: GATES_OUTPUT,
  limits: LIMITS_OUTPUT,
  conflicts: { conflicts: [] },
  verdict: VERDICT_OUTPUT,
};

/**
 * A mock for `structured` that answers by section: the valid reply above, or an override. An override that is
 * already a reply (has `ok`) is returned as it is, so a test can make one section fail or malformed.
 */
export function replyBySection(overrides: Record<string, unknown> = {}) {
  // The support check in verify answers with no verdicts, which changes no label, unless a test overrides it.
  const outputs: Record<string, unknown> = {
    judge_support: { verdicts: [] },
    ...ALL_OUTPUTS,
    ...overrides,
  };
  return (_tier: string, options: { name: string }) => {
    const section = options.name
      .replace(/^extract_/, "")
      .replace(/_repair$/, "");
    const value =
      options.name.endsWith("_repair") && `${section}_repair` in outputs
        ? outputs[`${section}_repair`]
        : outputs[section];
    const isReply =
      typeof value === "object" && value !== null && "ok" in value;
    return Promise.resolve(isReply ? value : replyOk(value));
  };
}
