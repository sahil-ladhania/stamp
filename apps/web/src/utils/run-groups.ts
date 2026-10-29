/**
 * File: run-groups.ts
 * Purpose: Groups the events of a run by stage, in time order, for the merged timeline. Each group keeps the stage's status and time
 *          from the run view, its event rows, and a one-line summary. The lifecycle events (started, done) are not rows: the group
 *          header says them. A retry pass adds a retry row to the Search group and its events join the same groups.
 * Exports: GroupItem, StageGroup, buildStageGroups
 * Used by: components/run/TraceTimeline.tsx, components/landing/step-visual-trace-data.ts
 */
import type { DowngradeReason, SourceTier } from "@stamp/schema";
import { summarizeStage } from "./stage-summary";
import type { RunViewEvent, StageView } from "./run-view";

const SEARCH_STAGE = 2; // A retry sends the run back to Search (docs/agent-architecture.md).

export type GroupItem =
  | { id: number; type: "search"; query: string }
  | { id: number; type: "page"; url: string; tier: SourceTier }
  /** `tier` is that of the page read earlier with the same address; null when that page was not seen. */
  | { id: number; type: "kept"; claimId: string; url: string; tier: SourceTier | null }
  | { id: number; type: "downgraded"; claimId: string; reason: DowngradeReason }
  | { id: number; type: "retry" };

export type StageGroup = StageView & {
  items: GroupItem[];
  summary: string | null;
};

export function buildStageGroups(stages: readonly StageView[], events: readonly RunViewEvent[]): StageGroup[] {
  const itemsByStage = new Map<number, GroupItem[]>();
  const tierByUrl = new Map<string, SourceTier>();
  const searchStarts = { count: 0 };
  let current: number | null = null;

  function add(item: GroupItem, stage: number | null = current): void {
    if (stage === null) return;
    itemsByStage.set(stage, [...(itemsByStage.get(stage) ?? []), item]);
  }

  events.forEach((event, id) => {
    switch (event.type) {
      case "stage.started":
        current = event.stage;
        if (event.stage === SEARCH_STAGE) {
          searchStarts.count += 1;
          if (searchStarts.count > 1) add({ id, type: "retry" });
        }
        break;
      case "search.query":
        add({ id, type: "search", query: event.query });
        break;
      case "page.fetched":
        tierByUrl.set(event.url, event.tier);
        add({ id, type: "page", url: event.url, tier: event.tier });
        break;
      case "claim.verified":
        add({ id, type: "kept", claimId: event.claimId, url: event.url, tier: tierByUrl.get(event.url) ?? null });
        break;
      case "claim.downgraded":
        add({ id, type: "downgraded", claimId: event.claimId, reason: event.reason });
        break;
      default:
        break;
    }
  });

  return stages.map((stage) => {
    const items = itemsByStage.get(stage.stage) ?? [];
    return { ...stage, items, summary: summarizeStage(stage.stage, items) };
  });
}
