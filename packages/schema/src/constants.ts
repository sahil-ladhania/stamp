/**
 * File: constants.ts
 * Purpose: Shared constants for guide schema version, pipeline stages, and difficulty bands.
 * Exports: SCHEMA_VERSION, STAGES, difficultyScoreForTotal
 * Used by: guide/guide.ts, guide/difficulty.ts, events.ts
 */
import type { StageId } from "./enums.js";

export const SCHEMA_VERSION = 1 as const;

export type StageDefinition = {
  id: StageId;
  name: string;
};

/** Fixed agent pipeline stages 0–8 per docs/agent-architecture.md. */
export const STAGES: readonly StageDefinition[] = [
  { id: 0, name: "resolve_app" },
  { id: 1, name: "plan_searches" },
  { id: 2, name: "search" },
  { id: 3, name: "fetch_pages" },
  { id: 4, name: "extract_facts" },
  { id: 5, name: "verify_quotes" },
  { id: 6, name: "probe_endpoints" },
  { id: 7, name: "score" },
  { id: 8, name: "save" },
] as const;

/** Maps difficulty point total (0–9) to score 1–5 per docs/solution.md. */
export function difficultyScoreForTotal(total: number): number {
  if (total <= 1) {
    return 1;
  }
  if (total <= 3) {
    return 2;
  }
  if (total <= 5) {
    return 3;
  }
  if (total <= 7) {
    return 4;
  }
  return 5;
}
