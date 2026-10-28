/**
 * File: state.ts
 * Purpose: LangGraph working memory passed between pipeline stages.
 * Exports: GraphState type
 * Used by: agent/graph.ts
 */
import type { Claim, DifficultyBreakdown, RunStreamEvent } from "@stamp/schema";
import type { AgentFailure } from "./agent-failure.js";
import type { PageRecord } from "./page-record.js";
import type { SearchResult } from "./search-result.js";

export type AppIdentity = {
  appName: string;
  domain: string;
  slug: string;
};

export type GraphState = {
  runId: string;
  app: AppIdentity;
  queries: string[];
  searchResults: SearchResult[];
  pages: PageRecord[];
  draftClaims: DraftClaimBucket[];
  claims: Claim[];
  retryCount: number;
  score: DifficultyBreakdown | null;
  events: RunStreamEvent[];
  failure: AgentFailure | null;
};

/** Draft facts keyed by section before verify assigns labels. */
export type DraftClaimBucket = {
  section: string;
  payload: unknown;
};
