/**
 * File: run-section.ts
 * Purpose: Extracts one guide section: picks the passages, calls the strong model, retries a 429 once, repairs a bad reply once, cleans the result.
 * Exports: runSection
 * Used by: agent/nodes/extract.ts
 */
import type { z } from "zod";
import { logger } from "../../lib/logger.js";
import { withRateLimitRetry } from "../../lib/openai-retry.js";
import { structured, type StructuredResult } from "../../lib/openai.js";
import { canRepairSchema } from "../budget.js";
import { extractMessages, repairMessages } from "../prompts/extract.js";
import { sourceNonce } from "../prompts/shared.js";
import { hasContent } from "./has-content.js";
import {
  KEYWORDS,
  SECTION_CHAR_BUDGET,
  VERDICT_CHAR_BUDGET,
} from "./keywords.js";
import { selectExcerpts } from "./passages.js";
import { sanitizeSection } from "./sanitize.js";
import {
  EXTRACT_CALL_CAP_MS,
  MIN_MODEL_CALL_MS,
  OutOfTime,
  failureReason,
  type SectionContext,
  type SectionResult,
} from "./section-types.js";
import {
  SECTION_SCHEMAS,
  type SectionId,
  type SectionOutput,
} from "./sections.js";

export async function runSection<K extends SectionId>(
  section: K,
  ctx: SectionContext,
): Promise<SectionResult<K>> {
  const started = ctx.now();
  const tally = { calls: 0, inputTokens: 0, outputTokens: 0 };
  const done = (
    status: SectionResult<K>["status"],
    reason: SectionResult<K>["reason"],
    extra: Partial<SectionResult<K>> = {},
  ): SectionResult<K> => ({
    section,
    status,
    reason,
    output: null,
    repaired: false,
    dropped: 0,
    excerptChars: 0,
    ...tally,
    durationMs: ctx.now() - started,
    ...extra,
  });

  const budget =
    section === "verdict" ? VERDICT_CHAR_BUDGET : SECTION_CHAR_BUDGET;
  const { excerpts, chars } = selectExcerpts(
    ctx.pages,
    KEYWORDS[section],
    budget,
  );
  if (excerpts.length === 0) {
    return done("unknown", "no_matching_passages");
  }
  const schema = SECTION_SCHEMAS[section] as unknown as z.ZodType<
    SectionOutput<K>
  >;
  const messages = extractMessages({
    section,
    app: ctx.app,
    nonce: sourceNonce(ctx.runId, section),
    excerpts,
    context: ctx.context,
  });

  let repaired = false; // true once a repair request has actually been sent
  const call = async (
    name: string,
    request: typeof messages,
  ): Promise<StructuredResult<SectionOutput<K>>> => {
    const reply = await withRateLimitRetry(
      () => {
        const timeoutMs = Math.min(
          EXTRACT_CALL_CAP_MS,
          ctx.deadline - ctx.now(),
        );
        if (timeoutMs < MIN_MODEL_CALL_MS) throw new OutOfTime();
        repaired = repaired || name.endsWith("_repair");
        return structured("strong", {
          schema,
          name,
          messages: request,
          timeoutMs,
          signal: ctx.signal,
          usage: ctx.usage,
          runId: ctx.runId,
        });
      },
      {
        signal: ctx.signal,
        canWait: (delayMs) =>
          ctx.deadline - ctx.now() > delayMs + MIN_MODEL_CALL_MS,
        onRetry: ({ delayMs }) =>
          logger.warn("model rate limited, retrying once", {
            runId: ctx.runId,
            name,
            delayMs,
          }),
      },
    );
    tally.calls += 1;
    tally.inputTokens += reply.usage.inputTokens;
    tally.outputTokens += reply.usage.outputTokens;
    return reply;
  };

  let reply: StructuredResult<SectionOutput<K>>;
  try {
    reply = await call(`extract_${section}`, messages);
    if (!reply.ok && canRepairSchema(0)) {
      reply = await call(
        `extract_${section}_repair`,
        repairMessages(messages, reply.raw, reply.message),
      );
    }
  } catch (err) {
    ctx.signal?.throwIfAborted();
    const reason = failureReason(err);
    logger.warn("extract call failed", { runId: ctx.runId, section, reason });
    return done("failed", reason, { repaired, excerptChars: chars });
  }
  if (!reply.ok) {
    logger.warn("extract reply rejected", {
      runId: ctx.runId,
      section,
      failure: reply.failure,
    });
    return done("failed", "schema_failed", { repaired, excerptChars: chars });
  }

  const cleaned = sanitizeSection(section, reply.data, {
    pages: ctx.index,
    stepCount: ctx.stepCount,
    blockerCount: ctx.blockerCount,
  });
  if (!hasContent(section, cleaned.output)) {
    return done(
      "unknown",
      cleaned.dropped > 0 ? "all_claims_dropped" : "nothing_found",
      {
        repaired,
        dropped: cleaned.dropped,
        excerptChars: chars,
      },
    );
  }
  return done("drafted", null, {
    output: cleaned.output,
    repaired,
    dropped: cleaned.dropped,
    excerptChars: chars,
  });
}
