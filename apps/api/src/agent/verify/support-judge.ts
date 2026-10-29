/**
 * File: support-judge.ts
 * Purpose: The support check: one batched fast-model call asks whether each Sourced claim's quote states it and whether its page is about the app. It can only take a label away; code applies the result.
 * Exports: claimItems, pageOf, runJudge, applyToClaims, reasonOf, JudgeOutputSchema, Verdict, JudgeOptions
 * Used by: agent/nodes/verify.ts, agent/verify/gate-judge.ts
 */
import type { DowngradeReason } from "@stamp/schema";
import { z } from "zod";
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import type { RunUsage } from "../../lib/usage.js";
import { errorText } from "../../utils/error-text.js";
import { judgeMessages, type JudgeItem } from "../prompts/support-judge.js";
import type { VerifiedClaims } from "./verify-claims.js";

const VerdictSchema = z.strictObject({
  id: z.string(),
  support: z.enum(["supported", "partly", "unsupported"]),
  aboutProduct: z.enum(["yes", "no", "unsure"]),
});
export const JudgeOutputSchema = z.strictObject({
  verdicts: z.array(VerdictSchema),
});
export type Verdict = Omit<z.infer<typeof VerdictSchema>, "id">;

/** A call is not started with less time than this left. */
const MIN_CALL_MS = 1_000;
const ATTEMPTS = 2;

/** `partly` and `unsupported` take the label away; a page that is clearly about another product does too. "Unsure" changes nothing. */
export function reasonOf(verdict: Verdict): DowngradeReason | null {
  if (verdict.aboutProduct === "no") return "off_product";
  return verdict.support === "supported" ? null : "not_supported";
}

export const pageOf = (url: string, title: string | undefined): string => {
  try {
    const { host, pathname } = new URL(url);
    return `${title ?? ""} (${host.replace(/^www\./, "")}${pathname})`.trim();
  } catch {
    return title ?? "";
  }
};

/** The Sourced claims, with the one quote and page each rests on. An Uncertain claim is never asked about. */
export function claimItems(
  verified: VerifiedClaims,
  titleOf: (url: string) => string | undefined,
): JudgeItem[] {
  return verified.claims.flatMap((claim) => {
    const source = claim.sources[0];
    return claim.label === "sourced" && source
      ? [
          {
            id: claim.id,
            claim: claim.text,
            quote: source.quote,
            page: pageOf(source.url, titleOf(source.url)),
          },
        ]
      : [];
  });
}

export type JudgeOptions = {
  now: () => number;
  /** The time, on the same clock, by which the check must be done. */
  deadline: number;
  signal?: AbortSignal | undefined;
  usage: RunUsage | undefined;
  runId: string;
};

/**
 * One batched call, tried at most twice while time remains. Returns the verdicts for the items it asked
 * about, or null when the check could not be done (no time, two failures): the labels then stay as the
 * code set them. An abort is not a failure and is thrown on.
 */
export async function runJudge(
  app: { appName: string; product: string | null },
  items: readonly JudgeItem[],
  options: JudgeOptions,
): Promise<Map<string, Verdict> | null> {
  if (items.length === 0) return new Map();
  const asked = new Set(items.map((item) => item.id));
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const timeoutMs = options.deadline - options.now();
    if (timeoutMs < MIN_CALL_MS) break;
    try {
      const result = await structured("fast", {
        schema: JudgeOutputSchema,
        name: "judge_support",
        messages: judgeMessages(app, items),
        timeoutMs,
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.usage ? { usage: options.usage } : {}),
        runId: options.runId,
      });
      if (result.ok) {
        return new Map(
          result.data.verdicts
            .filter((verdict) => asked.has(verdict.id))
            .map(({ id, ...verdict }) => [id, verdict] as const),
        );
      }
      logger.warn("support check reply unusable", {
        runId: options.runId,
        attempt,
        failure: result.failure,
      });
    } catch (err) {
      options.signal?.throwIfAborted();
      logger.warn("support check failed", {
        runId: options.runId,
        attempt,
        detail: errorText(err),
      });
    }
  }
  return null;
}

/** Sourced claims the verdicts reject become Uncertain with no source (their text stays); nothing is ever upgraded. */
export function applyToClaims(
  verified: VerifiedClaims,
  verdicts: ReadonlyMap<string, Verdict>,
): VerifiedClaims {
  const outcomes = [...verified.outcomes];
  const claims = verified.claims.map((claim, i) => {
    const verdict = verdicts.get(claim.id);
    const reason =
      verdict && claim.label === "sourced" ? reasonOf(verdict) : null;
    const outcome = outcomes[i];
    if (reason === null || !outcome) return claim;
    outcomes[i] = { ...outcome, label: "uncertain", downgrade: reason };
    return {
      id: claim.id,
      text: claim.text,
      label: "uncertain" as const,
      sources: [],
    };
  });
  return { ...verified, claims, outcomes };
}
