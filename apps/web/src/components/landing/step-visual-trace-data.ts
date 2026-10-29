/**
 * File: step-visual-trace-data.ts
 * Purpose: Made-up stages and events for the still picture of a run on the Landing page. They use example.com and a generic
 *          query, so no provider fact is stated.
 * Exports: SAMPLE_STAGES, SAMPLE_TRACE
 * Used by: components/landing/StepVisualTrace.tsx
 */
import type { StageView, TraceItem } from "@/utils/run-view";

export const SAMPLE_STAGES: readonly StageView[] = [
  { stage: 1, name: "Plan searches", kind: "model", status: "done", durationMs: 2000 },
  { stage: 2, name: "Search", kind: "external", status: "done", durationMs: 4000 },
  { stage: 3, name: "Fetch pages", kind: "external", status: "running", durationMs: null },
  { stage: 4, name: "Extract facts", kind: "model", status: "waiting", durationMs: null },
];

/** Newest first, the way the trace panel lists it. */
export const SAMPLE_TRACE: readonly TraceItem[] = [
  { id: 3, type: "kept", claimId: "requirements.0", url: "https://docs.example.com/oauth" },
  { id: 2, type: "page", url: "https://docs.example.com/oauth", tier: "official" },
  { id: 1, type: "search", query: "example oauth app review" },
];
