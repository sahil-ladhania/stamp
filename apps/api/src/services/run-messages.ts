/**
 * File: run-messages.ts
 * Purpose: Plain-language messages for run errors when only the error code is known.
 * Exports: RUN_ERROR_MESSAGES
 * Used by: services/run-executor.ts, services/run-view.ts
 */
import type { RunErrorCode } from "@stamp/schema";

export const RUN_ERROR_MESSAGES: Record<RunErrorCode, string> = {
  AMBIGUOUS_APP: "That name matches more than one app. Pick the one you mean.",
  NOT_OAUTH:
    "This app uses API keys, not OAuth, so Stamp cannot write a guide for it.",
  NO_PUBLIC_DOCS:
    "We could not find usable public docs for this app. Contact the provider directly.",
  INTERNAL: "Something went wrong while researching this app. Try again.",
};
