/**
 * File: section-types.ts
 * Purpose: The shapes, time limits and failure reasons shared by the section runner and the extract stage.
 * Exports: SectionContext, SectionResult, FailureReason, UnknownReason, OutOfTime, failureReason, EXTRACT_CALL_CAP_MS, MIN_MODEL_CALL_MS
 * Used by: agent/extract/run-section.ts, agent/nodes/extract.ts
 */
import { ModelCallError } from "../../lib/openai-client.js";
import type { RunUsage } from "../../lib/usage.js";
import { TimeoutError } from "../../utils/with-timeout.js";
import type { PageRecord } from "../page-record.js";
import type { PageIndex } from "./sanitize.js";
import type { SectionId, SectionOutput } from "./sections.js";

/** No single call may use more than this of the stage's window, so one slow call cannot starve the rest. */
export const EXTRACT_CALL_CAP_MS = 25_000;
/** A model call needs about this long even for a tiny reply (measured 3.6 s), so less than this is not started. */
export const MIN_MODEL_CALL_MS = 5_000;

export type FailureReason =
  "schema_failed" | "timeout" | "time_budget" | "rate_limited" | "model_error";
export type UnknownReason =
  "no_matching_passages" | "nothing_found" | "all_claims_dropped";

export type SectionContext = {
  runId: string;
  app: { appName: string; domain: string };
  pages: readonly PageRecord[];
  index: PageIndex;
  signal?: AbortSignal;
  usage: RunUsage;
  now: () => number;
  /** When the stage's time window ends, on the same clock as `now`. */
  deadline: number;
  /** Extra data for the section (the verdict's numbered steps and blockers) and the list lengths it points into. */
  context?: string;
  stepCount?: number;
  blockerCount?: number;
};

export type SectionResult<K extends SectionId> = {
  section: K;
  status: "drafted" | "unknown" | "failed";
  output: SectionOutput<K> | null;
  reason: FailureReason | UnknownReason | null;
  calls: number;
  repaired: boolean;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  dropped: number;
  excerptChars: number;
};

/** Thrown inside a call when the window has no room left; becomes the time_budget failure. */
export class OutOfTime extends Error {}

export function failureReason(err: unknown): FailureReason {
  if (err instanceof OutOfTime) return "time_budget";
  if (err instanceof TimeoutError) return "timeout";
  if (err instanceof ModelCallError && err.status === 429)
    return "rate_limited";
  return "model_error";
}
