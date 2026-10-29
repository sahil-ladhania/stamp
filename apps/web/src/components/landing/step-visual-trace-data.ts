/**
 * File: step-visual-trace-data.ts
 * Purpose: Made-up events for the still picture of a run on the Landing page, run through the same grouping the real run page uses. They
 *          use example.com and a generic query, so no provider fact is stated.
 * Exports: SAMPLE_GROUPS
 * Used by: components/landing/StepVisualTrace.tsx
 */
import { buildStageGroups } from "@/utils/run-groups";
import { deriveRunView, type RunViewEvent } from "@/utils/run-view";

const events: RunViewEvent[] = [
  { type: "stage.started", stage: 2, name: "search" },
  { type: "search.query", query: "example oauth app review" },
  { type: "search.query", query: "example oauth scopes" },
  { type: "stage.done", stage: 2, durationMs: 2000 },
  { type: "stage.started", stage: 3, name: "fetch" },
  { type: "page.fetched", url: "https://docs.example.com/oauth", tier: "official" },
  { type: "page.fetched", url: "https://guides.example.net/setup", tier: "third_party" },
];

const STAGES_SHOWN = [2, 3, 5];

/** Search (done), Fetch pages (running, with its rows) and Verify quotes (waiting). */
export const SAMPLE_GROUPS = buildStageGroups(deriveRunView(events).stages, events).filter((group) =>
  STAGES_SHOWN.includes(group.stage),
);
