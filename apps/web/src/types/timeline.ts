/**
 * File: timeline.ts
 * Purpose: UI-only stage status derived from run snapshot and SSE events.
 * Exports: TimelineStageStatus
 * Used by: run progress components, useRunStream
 */
import type { StageDefinition } from "@stamp/schema";

export type TimelineStageStatus = "pending" | "active" | "done" | "failed";

export type TimelineStageView = StageDefinition & {
  status: TimelineStageStatus;
};
