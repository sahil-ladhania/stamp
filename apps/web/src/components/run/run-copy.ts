/**
 * File: run-copy.ts
 * Purpose: The wording of the Live run page outside its errors: the status line, the tab title, the result card's heading and lead,
 *          and the actions that open the guide or research again.
 * Exports: RunAction, NEW_RUN, SEARCH_AGAIN, OPEN_LIBRARY, getStageLine, getRunTitle, getResultCopy, getResultActions
 * Used by: components/run/RunScreen.tsx, components/run/RunResultCard.tsx, components/run/run-error-copy.ts
 */
import { formatSecondsInWords } from "@/utils/format-duration";
import type { RunPhase } from "@/utils/run-phase";
import { RUN_TIME_LIMIT_MS } from "@/utils/run-budgets";
import { RUN_STAGES } from "@/utils/run-stages";

type Variant = "primary" | "secondary";

/** A link goes to a page. `new-run` researches the same app again; `reconnect` follows the same run again. */
export type RunAction =
  | { kind: "link"; label: string; to: string; variant: Variant }
  | { kind: "new-run" | "reconnect"; label: string; variant: Variant };

export const NEW_RUN: RunAction = { kind: "new-run", label: "Retry run", variant: "secondary" };
export const SEARCH_AGAIN: RunAction = { kind: "link", label: "Search for another app", to: "/app", variant: "primary" };
export const OPEN_LIBRARY: RunAction = { kind: "link", label: "Open the library", to: "/app", variant: "secondary" };

const stageByNumber = (stage: number | null) => RUN_STAGES.find((item) => item.stage === stage);

type StageLineInput = {
  phase: RunPhase;
  /** The stage that is running, or the one that stopped. */
  stage: number | null;
};

/** The current stage in plain words. It changes with the stage, never with the clock, so a polite live region can say it. */
export function getStageLine({ phase, stage }: StageLineInput): string {
  const plain = stageByNumber(stage)?.plain;
  switch (phase) {
    case "connecting":
      return "Connecting to the run";
    case "running":
      return plain ?? "Working";
    case "done":
      return "Guide ready";
    case "partial":
      return "Time ran out. Guide saved";
    case "stopped":
      return plain ? `Stopped while ${plain.toLowerCase()}` : "Stopped";
    case "disconnected":
      return "Lost the connection";
    case "not-found":
      return "No run at this address";
  }
}

/** The tab title. An error, a lost stream or an unknown run uses the heading of its notice. */
export function getRunTitle(phase: RunPhase, appName: string | null, noticeTitle: string | null): string {
  switch (phase) {
    case "connecting":
    case "running":
      return `Researching ${appName ?? "this app"}`;
    case "done":
      return `${appName ?? "The"} guide is ready`;
    case "partial":
      return `${appName ?? "The"} guide is partial`;
    default:
      return noticeTitle ?? "Run";
  }
}

type ResultCopyInput = {
  isPartial: boolean;
  /** The run is over and its trace is gone (an API restart or the retention window). */
  isSummaryOnly: boolean;
  elapsedMs: number;
};

export function getResultCopy({ isPartial, isSummaryOnly, elapsedMs }: ResultCopyInput): { heading: string; lead: string } {
  if (isPartial) {
    return {
      heading: "The guide is partial",
      lead: isSummaryOnly
        ? "This run finished earlier. Stamp saved what it had and marked the missing sections Uncertain."
        : `The run reached its ${RUN_TIME_LIMIT_MS / 1000} second limit. Stamp saved what it has and marked the missing sections Uncertain.`,
    };
  }
  return {
    heading: "The guide is ready",
    lead: isSummaryOnly
      ? "This run finished earlier. Its trace is no longer kept, but the guide is saved."
      : `Stamp finished in ${formatSecondsInWords(elapsedMs)}. Read the trace below, or open the guide now.`,
  };
}

/** The slug is the one the run saved, which can differ from the one asked for. */
export function getResultActions(slug: string, isPartial: boolean): RunAction[] {
  const open: RunAction = {
    kind: "link",
    label: isPartial ? "Open the partial guide" : "Open the guide",
    to: `/g/${slug}`,
    variant: "primary",
  };
  return isPartial ? [open, NEW_RUN] : [open];
}
