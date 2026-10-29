/**
 * File: run-stages.ts
 * Purpose: The nine pipeline stages and who runs each, from docs/agent-architecture.md.
 * Exports: StageKind, RunStage, RUN_STAGES, STAGE_KIND_LABEL
 * Used by: utils/run-view.ts, components/verify/StageList.tsx, components/run/StageBar.tsx, components/run/StageGroup.tsx
 */

/** model = AI model, external = outside call, code = our code. */
export type StageKind = "model" | "external" | "code";

/** `plain` is the stage in words for the status line: "Reading pages". */
export type RunStage = { stage: number; name: string; kind: StageKind; plain: string };

export const RUN_STAGES: readonly RunStage[] = [
  { stage: 0, name: "Resolve app", kind: "code", plain: "Finding the app" },
  { stage: 1, name: "Plan searches", kind: "model", plain: "Planning searches" },
  { stage: 2, name: "Search", kind: "external", plain: "Searching" },
  { stage: 3, name: "Fetch pages", kind: "external", plain: "Reading pages" },
  { stage: 4, name: "Extract facts", kind: "model", plain: "Drafting claims" },
  { stage: 5, name: "Verify quotes", kind: "code", plain: "Checking quotes" },
  { stage: 6, name: "Probe endpoints", kind: "external", plain: "Testing endpoints" },
  { stage: 7, name: "Score", kind: "code", plain: "Scoring" },
  { stage: 8, name: "Save", kind: "code", plain: "Saving the guide" },
];

// Words, not colours: green, blue and amber already mean the three evidence labels.
export const STAGE_KIND_LABEL: Record<StageKind, string> = {
  model: "AI model",
  external: "Outside call",
  code: "Our code",
};
