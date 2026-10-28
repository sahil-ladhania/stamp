/**
 * File: run-copy.ts
 * Purpose: All wording for the Live run page: heading, lead and actions for each outcome and for a stream that failed.
 * Exports: RunAction, RunCopy, RunCopyContext, getRunCopy, getStreamFailureCopy, getRunStatusLine
 * Used by: components/run/RunScreen.tsx, components/run/RunHeader.tsx
 */
import type { RunErrorCode } from "@stamp/schema";
import type { ApiError } from "@/lib/api-error";
import { getApiErrorMessage, RUN_ERROR_COPY } from "@/utils/error-messages";
import { formatSecondsInWords } from "@/utils/format-duration";
import { pluralize } from "@/utils/plural";
import { RUN_PAGE_LIMIT, RUN_TIME_LIMIT_MS } from "@/utils/run-budgets";
import { RUN_STAGES } from "@/utils/run-stages";
import type { RunView } from "@/utils/run-view";

type Variant = "primary" | "secondary";

/** A link goes to a page. `new-run` researches the same app again; `reconnect` follows the same run again. */
export type RunAction =
  | { kind: "link"; label: string; to: string; variant: Variant }
  | { kind: "new-run" | "reconnect"; label: string; variant: Variant };

export type RunCopy = {
  heading: string;
  lead: string;
  actions: RunAction[];
};

export type RunCopyContext = {
  appName: string | null;
  elapsedMs: number;
  /** The run is over and its trace is gone (an API restart or the retention window), so there are no counts to quote. */
  isSummaryOnly: boolean;
};

const NEW_RUN: RunAction = { kind: "new-run", label: "Retry run", variant: "secondary" };
const SEARCH_AGAIN: RunAction = {
  kind: "link",
  label: "Search for another app",
  to: "/app",
  variant: "primary",
};
const OPEN_LIBRARY: RunAction = {
  kind: "link",
  label: "Open the library",
  to: "/app",
  variant: "secondary",
};

function stageName(stage: number): string {
  return RUN_STAGES.find((item) => item.stage === stage)?.name ?? "this stage";
}

function openGuide(label: string, slug: string): RunAction {
  return { kind: "link", label, to: `/g/${slug}`, variant: "primary" };
}

function finishedCopy(
  view: RunView,
  slug: string,
  isPartial: boolean,
  { appName, elapsedMs, isSummaryOnly }: RunCopyContext,
): RunCopy {
  const name = appName ?? "The";
  if (isPartial) {
    return {
      heading: `${name} guide is partial`,
      lead: isSummaryOnly
        ? "This run finished earlier. Stamp saved what it had and marked the missing sections Uncertain."
        : `The run reached its ${RUN_TIME_LIMIT_MS / 1000} second limit. Stamp saved what it has and marked the missing sections Uncertain.`,
      actions: [openGuide("Open the partial guide", slug), NEW_RUN],
    };
  }
  return {
    heading: `${name} guide is ready`,
    lead: isSummaryOnly
      ? "This run finished earlier. Its trace is no longer kept, but the guide is saved."
      : `Stamp finished in ${formatSecondsInWords(elapsedMs)}. It read ${pluralize(view.pagesRead, "page")}, kept ${pluralize(view.claimsKept, "claim")} and downgraded ${view.claimsDowngraded} to Uncertain. Read the trace below before you open it, or open it now.`,
    actions: [openGuide("Open the guide", slug)],
  };
}

function errorCopy(code: RunErrorCode, stage: number, hasOptions: boolean): RunCopy {
  switch (code) {
    case "NOT_OAUTH":
      return {
        heading: "This app is out of scope",
        lead: RUN_ERROR_COPY.NOT_OAUTH,
        actions: [
          SEARCH_AGAIN,
          { kind: "link", label: "Read how we verify", to: "/how-we-verify", variant: "secondary" },
        ],
      };
    case "NO_PUBLIC_DOCS":
      return {
        heading: "No public docs for this app",
        lead: RUN_ERROR_COPY.NO_PUBLIC_DOCS,
        actions: [SEARCH_AGAIN],
      };
    case "AMBIGUOUS_APP":
      return {
        heading: "More than one app matches",
        lead: RUN_ERROR_COPY.AMBIGUOUS_APP,
        // The options panel is the action. Without options (the API restarted) the visitor searches again.
        actions: hasOptions ? [] : [SEARCH_AGAIN],
      };
    case "INTERNAL":
      return {
        heading: `The run stopped at ${stageName(stage)}`,
        lead: RUN_ERROR_COPY.INTERNAL,
        actions: [{ ...NEW_RUN, variant: "primary" }, OPEN_LIBRARY],
      };
  }
}

/** The running lead names the budgets; the finished copy reads its numbers from the events. */
export function getRunCopy(view: RunView, context: RunCopyContext): RunCopy {
  const { outcome } = view;
  if (outcome.kind === "error") {
    return errorCopy(outcome.code, outcome.stage, outcome.options.length > 0);
  }
  if (outcome.kind === "done") {
    return finishedCopy(view, outcome.slug, outcome.status === "partial", context);
  }
  return {
    heading: `Researching ${context.appName ?? "this app"}`,
    lead: `Each step appears below as it happens. Stamp reads up to ${RUN_PAGE_LIMIT} pages and stops after ${formatSecondsInWords(RUN_TIME_LIMIT_MS)}, keeping whatever it has found.`,
    actions: [],
  };
}

/** The stream itself failed: the run is unknown, or the connection is gone for good. */
export function getStreamFailureCopy(error: ApiError): RunCopy {
  if (error.code === "NOT_FOUND") {
    return {
      heading: "Run not found",
      lead: getApiErrorMessage(error),
      actions: [{ ...SEARCH_AGAIN, label: "Search for an app" }],
    };
  }
  return {
    heading: "Stamp lost the run",
    lead: getApiErrorMessage(error),
    actions: [
      { kind: "reconnect", label: "Reconnect to the run", variant: "primary" },
      OPEN_LIBRARY,
    ],
  };
}

type StatusInput = {
  isRunning: boolean;
  isConnecting: boolean;
  currentStageName: string | null;
  heading: string;
};

/** The polite status line: the stage while running, the outcome once it ends. */
export function getRunStatusLine({ isRunning, isConnecting, currentStageName, heading }: StatusInput): string {
  if (!isRunning) return `${heading}.`;
  if (currentStageName) return `Now: ${currentStageName}.`;
  return isConnecting ? "Connecting to the run." : "";
}
