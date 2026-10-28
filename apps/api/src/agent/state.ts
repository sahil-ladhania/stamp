/**
 * File: state.ts
 * Purpose: The graph's working memory: typed state channels, with reducers where a node adds to a list.
 * Exports: AgentState, State, StateUpdate, AppIdentity, SectionDraft, AuthMethod, Gates, ProbeResult, appendUnique
 * Used by: agent/graph.ts, agent/stage-node.ts, agent/routes.ts, agent/run-real-agent.ts, agent/nodes/*
 */
import { Annotation } from "@langchain/langgraph";
import type {
  Archetype,
  Claim,
  Conflict,
  DifficultyBreakdown,
  Guide,
  StageId,
} from "@stamp/schema";
import type { AgentFailure } from "./agent-failure.js";
import type { ProbeOutcome } from "./evidence/labelling.js";
import type { PageRecord } from "./page-record.js";
import type { PlannedQuery } from "./queries.js";
import type { GateFacts } from "./scoring/difficulty.js";
import type { SearchResult } from "./search-result.js";

/** The official app the run is about; resolve (stage 0) fills it. */
export type AppIdentity = { appName: string; domain: string; slug: string };

/** One guide section after extract: drafted, not found in the pages, or failed after its one repair. */
export type SectionDraft =
  | { status: "drafted"; payload: unknown }
  | { status: "unknown" }
  | { status: "failed"; reason: string };

export type AuthMethod = "oauth" | "both" | "api_key_only" | "unknown";

/** The auth method and the difficulty facts behind the score; extract fills it, verify checks it. */
export type Gates = { authMethod: AuthMethod; facts: GateFacts };

export type ProbeResult = { url: string; outcome: ProbeOutcome };

const replace = <T>(_current: T, next: T): T => next;

/** A channel where the latest write wins. */
function last<T>(initial: () => T) {
  return Annotation<T>({ reducer: replace, default: initial });
}

/** Reducer that appends new items and drops any whose key is already held. */
export function appendUnique<T>(key: (item: T) => string) {
  return (current: T[], added: T[]): T[] => {
    const seen = new Set(current.map(key));
    const fresh = added.filter((item) => {
      const id = key(item);
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
    return fresh.length === 0 ? current : [...current, ...fresh];
  };
}

/**
 * Field names must differ from node names (LangGraph rejects a clash), so the probe and
 * score results are `probeResult` and `difficulty`. Events are emitted live and kept out of state;
 * the mutable token and call meter is in the run's deps (agent/deps.ts).
 */
export const AgentState = Annotation.Root({
  /** What the user typed: an app name or URL. */
  typed: Annotation<string>(),
  slug: Annotation<string>(),
  app: last<AppIdentity | null>(() => null),
  queries: last<PlannedQuery[]>(() => []),
  searchResults: Annotation<SearchResult[]>({
    reducer: appendUnique((result) => result.url),
    default: () => [],
  }),
  pages: Annotation<PageRecord[]>({
    reducer: appendUnique((page) => page.urlHash),
    default: () => [],
  }),
  /** Keyed by section name; a retry pass adds or replaces only the sections it re-extracted. */
  drafts: Annotation<Record<string, SectionDraft>>({
    reducer: (current, added) => ({ ...current, ...added }),
    default: () => ({}),
  }),
  gates: last<Gates | null>(() => null),
  claims: last<Claim[]>(() => []),
  conflicts: last<Conflict[]>(() => []),
  /** 0 or 1: how many retry passes have started. The graph bumps it when search starts a retry. */
  retryCount: last<number>(() => 0),
  /** Sections with no matched quote after verify; the retry edge fires only while this is non-empty. */
  missingSections: last<string[]>(() => []),
  probeResult: last<ProbeResult | null>(() => null),
  difficulty: last<DifficultyBreakdown | null>(() => null),
  archetype: last<Archetype | null>(() => null),
  guide: last<Guide | null>(() => null),
  /** Sticky: once any node sets it, it stays set. */
  partial: Annotation<boolean>({
    reducer: (current, next) => current || next,
    default: () => false,
  }),
  failure: last<AgentFailure | null>(() => null),
  /** Stages that ran to stage.done (retry passes repeat 2 to 5; each shows once). */
  completed: Annotation<StageId[]>({
    reducer: (current, added) => [...new Set([...current, ...added])],
    default: () => [],
  }),
});

export type State = typeof AgentState.State;
export type StateUpdate = typeof AgentState.Update;
