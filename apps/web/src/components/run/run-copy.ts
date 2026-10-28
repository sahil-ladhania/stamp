/**
 * File: run-copy.ts
 * Purpose: All wording for the Live run page: heading, lead and actions for each outcome.
 * Exports: RunAction, RunCopy, getRunCopy
 * Used by: components/run/RunScreen.tsx
 */
import { MOCK_RUN_ID } from "@/mocks/run-events";
import type { RunErrorCode } from "@/mocks/types";
import { RUN_PAGE_LIMIT, RUN_TIME_LIMIT_MS } from "@/utils/run-budgets";
import { formatSecondsInWords } from "@/utils/format-duration";
import { pluralize } from "@/utils/plural";
import { RUN_STAGES } from "@/utils/run-stages";
import type { RunView } from "@/utils/run-view";

export type RunAction = {
  label: string;
  to: string;
  variant: "primary" | "secondary";
};

export type RunCopy = {
  heading: string;
  lead: string;
  actions: RunAction[];
};

const RETRY: RunAction = {
  label: "Retry run",
  to: `/run/${MOCK_RUN_ID}`,
  variant: "secondary",
};
const SEARCH_AGAIN: RunAction = {
  label: "Search for another app",
  to: "/app",
  variant: "primary",
};

function stageName(stage: number): string {
  return RUN_STAGES.find((item) => item.stage === stage)?.name ?? "this stage";
}

function finishedCopy(
  view: RunView,
  appName: string,
  slug: string,
  isPartial: boolean,
  elapsedMs: number,
): RunCopy {
  if (isPartial) {
    return {
      heading: `${appName} guide is partial`,
      lead: `The run reached its ${RUN_TIME_LIMIT_MS / 1000} second limit. Stamp saved what it has and marked the missing sections Uncertain.`,
      actions: [
        {
          label: "Open the partial guide",
          to: `/g/${slug}`,
          variant: "primary",
        },
        RETRY,
      ],
    };
  }
  return {
    heading: `${appName} guide is ready`,
    lead: `Stamp finished in ${formatSecondsInWords(elapsedMs)}. It read ${pluralize(view.pagesRead, "page")}, kept ${pluralize(view.claimsKept, "claim")} and downgraded ${view.claimsDowngraded} to Uncertain. Read the trace below before you open it, or open it now.`,
    actions: [
      { label: "Open the guide", to: `/g/${slug}`, variant: "primary" },
    ],
  };
}

function errorCopy(code: RunErrorCode, stage: number): RunCopy {
  switch (code) {
    case "NOT_OAUTH":
      return {
        heading: "This app is out of scope",
        lead: "It uses API keys, not OAuth. Stamp covers provider OAuth apps only, so it stopped before writing a guide. Search for a different app.",
        actions: [SEARCH_AGAIN],
      };
    case "NO_PUBLIC_DOCS":
      return {
        heading: "No public docs for this app",
        lead: "Stamp searched but found no public docs it can use. Contact the provider for setup details.",
        actions: [SEARCH_AGAIN],
      };
    case "AMBIGUOUS_APP":
      return {
        heading: "More than one app matches",
        lead: "Stamp needs to know which one you meant. Choose an app to continue.",
        actions: [
          {
            label: "Choose an app",
            to: "/app?state=ambiguous",
            variant: "primary",
          },
        ],
      };
    default:
      return {
        heading: `The run stopped at ${stageName(stage)}`,
        lead: "Something failed on our side. Retry the run, or open a library guide instead.",
        actions: [
          { ...RETRY, variant: "primary" },
          { label: "Open the library", to: "/app", variant: "secondary" },
        ],
      };
  }
}

/** The running lead names the budgets; the finished copy reads its numbers from the events. */
export function getRunCopy(
  view: RunView,
  appName: string | null,
  elapsedMs: number,
): RunCopy {
  const { outcome } = view;
  if (outcome.kind === "error") return errorCopy(outcome.code, outcome.stage);
  if (outcome.kind === "done") {
    return finishedCopy(
      view,
      appName ?? "The",
      outcome.slug,
      outcome.status === "partial",
      elapsedMs,
    );
  }
  return {
    heading: `Researching ${appName ?? "this app"}`,
    lead: `Each step appears below as it happens. Stamp reads up to ${RUN_PAGE_LIMIT} pages and stops after ${formatSecondsInWords(RUN_TIME_LIMIT_MS)}, keeping whatever it has found.`,
    actions: [],
  };
}
