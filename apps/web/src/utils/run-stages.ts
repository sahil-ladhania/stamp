/**
 * File: run-stages.ts
 * Purpose: The nine pipeline stages and who runs each, from docs/agent-architecture.md.
 * Exports: StageKind, RunStage, RUN_STAGES, STAGE_KIND_LABEL
 * Used by: mocks/run-events.ts, utils/run-view.ts, components/verify/StageList.tsx, components/run/StageItem.tsx
 */

/** model = AI model, external = outside call, code = our code. */
export type StageKind = "model" | "external" | "code";

export type RunStage = { stage: number; name: string; kind: StageKind };

export const RUN_STAGES: readonly RunStage[] = [
  { stage: 0, name: "Resolve app", kind: "code" },
  { stage: 1, name: "Plan searches", kind: "model" },
  { stage: 2, name: "Search", kind: "external" },
  { stage: 3, name: "Fetch pages", kind: "external" },
  { stage: 4, name: "Extract facts", kind: "model" },
  { stage: 5, name: "Verify quotes", kind: "code" },
  { stage: 6, name: "Probe endpoints", kind: "external" },
  { stage: 7, name: "Score", kind: "code" },
  { stage: 8, name: "Save", kind: "code" },
];

// Words, not colours: green, blue and amber already mean the three evidence labels.
export const STAGE_KIND_LABEL: Record<StageKind, string> = {
  model: "AI model",
  external: "Outside call",
  code: "Our code",
};
