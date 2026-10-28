/**
 * File: full-run.ts
 * Purpose: Inline mocks for a full graph run with the real stages: two docs pages (one quoting the authorize URL), search and extract replies, and model replies for every section.
 * Exports: AUTH_URL, AUTH_SENTENCE, PAGE_TEXT, MODEL_REPLIES, searchReply, extractReply, fullRunInput, resetFullRun
 * Used by: agent/run-real-agent-full*.test.ts
 */
import type { Mock } from "vitest";
import type { AgentEvent, RunAgentInput } from "../agent/run-agent.js";
import {
  OAUTH_TEXT,
  OAUTH_URL,
  REVIEW_TEXT,
  REVIEW_URL,
  claim,
} from "./extract-fixtures.js";
import { ALL_OUTPUTS, STEPS_OUTPUT } from "./extract-replies.js";

export const AUTH_URL = "https://acme.com/oauth/authorize";
export const AUTH_SENTENCE = `Send users to ${AUTH_URL} to start the flow.`;

/**
 * The OAuth docs page, plus the sentence a Sourced claim can quote for the probe. The review page gets a
 * closing paragraph: the fetch stage drops a page shorter than 300 characters as not a real page.
 */
export const PAGE_TEXT: Record<string, string> = {
  [OAUTH_URL]: `${OAUTH_TEXT}\n\n${AUTH_SENTENCE}`,
  [REVIEW_URL]: `${REVIEW_TEXT}\n\nQuestions about the review can be sent to the developer support team from the developer portal. Include your app name and the client ID.`,
};

const NO_QUERIES = {
  setup: null,
  scopes: null,
  review: null,
  limits: null,
  authType: null,
  approvalWait: null,
};

/** A reply for every section, with the first step quoting the authorize URL. */
export const MODEL_REPLIES: Record<string, unknown> = {
  ...ALL_OUTPUTS,
  plan_queries: NO_QUERIES,
  steps: {
    steps: [
      {
        title: "Send users to authorize",
        detail: claim(
          OAUTH_URL,
          AUTH_SENTENCE,
          "Send users to the authorize URL.",
        ),
        actor: "human" as const,
        effort: null,
      },
      ...STEPS_OUTPUT.steps,
    ],
  },
};

/** Tavily search: both docs pages, whatever the query. */
export const searchReply = () => ({
  hits: [OAUTH_URL, REVIEW_URL].map((url, i) => ({
    url,
    title: "Docs",
    snippet: "snippet",
    score: 0.9 - i / 10,
  })),
  credits: 1,
});

/** Tavily extract: the text of each requested page that exists. */
export const extractReply = (urls: string[]) => ({
  pages: urls.flatMap((url) =>
    PAGE_TEXT[url] ? [{ url, title: null, text: PAGE_TEXT[url] }] : [],
  ),
  failed: [],
  credits: 1,
});

export function fullRunInput(): { input: RunAgentInput; events: AgentEvent[] } {
  const events: AgentEvent[] = [];
  return {
    events,
    input: {
      runId: "run_full",
      app: "acme.com",
      slug: "acme",
      emit: (event) => {
        events.push(event);
        return Promise.resolve();
      },
      signal: new AbortController().signal,
    },
  };
}

/** Puts the mocks back to the happy path: search and extract answer, DNS gives a public address, the probe is rejected by the provider. */
export function resetFullRun(mocks: {
  search: Mock;
  extract: Mock;
  fetch: Mock;
  dns: Mock;
}): void {
  mocks.search
    .mockReset()
    .mockImplementation(() => Promise.resolve(searchReply()));
  mocks.extract
    .mockReset()
    .mockImplementation((urls: string[]) =>
      Promise.resolve(extractReply(urls)),
    );
  mocks.fetch
    .mockReset()
    .mockImplementation(() =>
      Promise.resolve(
        new Response('{"error":"invalid_client"}', { status: 400 }),
      ),
    );
  mocks.dns
    .mockReset()
    .mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
}
