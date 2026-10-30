/**
 * File: run-error-copy.ts
 * Purpose: The wording and actions for a run that did not finish: each run.error code, a stream that failed, and a run that is unknown.
 * Exports: RunNoticeCopy, getErrorNotice, getStreamFailureNotice
 * Used by: components/run/RunScreen.tsx
 */
import type { RunErrorCode } from "@stamp/schema";
import type { ApiError } from "@/lib/api-error";
import { getApiErrorMessage, RUN_ERROR_COPY } from "@/utils/error-messages";
import { RUN_STAGES } from "@/utils/run-stages";
import { NEW_RUN, OPEN_LIBRARY, SEARCH_AGAIN, type RunAction } from "./run-copy";

export type RunNoticeCopy = { title: string; lead: string; actions: RunAction[] };

function stageName(stage: number): string {
  return RUN_STAGES.find((item) => item.stage === stage)?.name ?? "this stage";
}

export function getErrorNotice(code: RunErrorCode, stage: number, hasOptions: boolean): RunNoticeCopy {
  switch (code) {
    case "NOT_OAUTH":
      return {
        title: "This app is out of scope",
        lead: RUN_ERROR_COPY.NOT_OAUTH,
        actions: [SEARCH_AGAIN, { kind: "link", label: "Read how we verify", to: "/how-we-verify", variant: "secondary" }],
      };
    case "NO_PUBLIC_DOCS":
      return { title: "No public docs for this app", lead: RUN_ERROR_COPY.NO_PUBLIC_DOCS, actions: [SEARCH_AGAIN] };
    case "AMBIGUOUS_APP":
      return {
        title: "Which app do you mean?",
        lead: RUN_ERROR_COPY.AMBIGUOUS_APP,
        // The options are the action. Without them (the API restarted) the visitor searches again.
        actions: hasOptions ? [] : [SEARCH_AGAIN],
      };
    case "INTERNAL":
      return {
        title: `The run stopped at ${stageName(stage)}`,
        lead: RUN_ERROR_COPY.INTERNAL,
        actions: [{ ...NEW_RUN, variant: "primary" }, OPEN_LIBRARY],
      };
  }
}

/** The stream itself failed: the run is unknown, or the connection is gone for good. */
export function getStreamFailureNotice(error: ApiError): RunNoticeCopy {
  if (error.code === "NOT_FOUND") {
    return {
      title: "Run not found",
      lead: getApiErrorMessage(error),
      actions: [{ ...SEARCH_AGAIN, label: "Search for an app" }],
    };
  }
  return {
    title: "Stamp lost the run",
    lead: getApiErrorMessage(error),
    actions: [{ kind: "reconnect", label: "Reconnect to the run", variant: "primary" }, OPEN_LIBRARY],
  };
}
