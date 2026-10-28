/**
 * File: not-found-copy.ts
 * Purpose: All wording for the three Not found states in one place: heading, lead, action and stamp rows.
 * Exports: getNotFoundCopy
 * Used by: components/not-found/NotFoundPanel.tsx
 */
import type { StampRowData } from "@/components/guide/ResultStamp";
import { MOCK_RUN_ID } from "@/mocks/run-events";
import type { NotFoundHint } from "@/utils/not-found-hint";

type LeadAction = { label: string; to: string };

type NotFoundCopy = {
  heading: string;
  lead: string;
  /** Shown above the lead action, for example "Did you mean HubSpot?". */
  question: string | null;
  /** The red button, when the page has a likelier next step than search. */
  action: LeadAction | null;
  searchPrompt: string;
  stampRows: StampRowData[];
};

const GENERIC_LEAD =
  "The address may have a typo, or the page may have moved. Stamp only shows what it can source, so we will not guess.";
const SEARCH_PROMPT = "Looking for an app guide? Search for it by name.";

function stampRows(
  result: string,
  source: string,
  nextStep: string,
): StampRowData[] {
  return [
    { label: "Result", value: result },
    { label: "Source", value: source },
    { label: "Next step", value: nextStep },
  ];
}

/** Returns the copy for a hint. The stamp speaks in Stamp's evidence voice, not in HTTP codes. */
export function getNotFoundCopy(hint: NotFoundHint): NotFoundCopy {
  switch (hint.kind) {
    case "suggestion": {
      const label = `Open the ${hint.guide.appName} guide`;
      return {
        heading: "No record of that page",
        lead: GENERIC_LEAD,
        question: `Did you mean ${hint.guide.appName}?`,
        action: { label, to: `/g/${hint.guide.slug}` },
        searchPrompt: SEARCH_PROMPT,
        stampRows: stampRows("Not found", "No source page found", label),
      };
    }
    case "unknown-guide": {
      const label = `Research ${hint.appName} live`;
      return {
        heading: `No guide for ${hint.appName} yet`,
        lead: "Stamp has not researched this app. The agent can do it now, and you will watch each search and each page it reads.",
        question: null,
        action: {
          label,
          to: `/run/${MOCK_RUN_ID}?app=${encodeURIComponent(hint.appName)}`,
        },
        searchPrompt: "Or search for a different app.",
        stampRows: stampRows("No guide yet", "Not researched", label),
      };
    }
    case "default":
      return {
        heading: "No record of that page",
        lead: GENERIC_LEAD,
        question: null,
        action: null,
        searchPrompt: SEARCH_PROMPT,
        stampRows: stampRows(
          "Not found",
          "No source page found",
          "Search for the app you meant",
        ),
      };
  }
}
