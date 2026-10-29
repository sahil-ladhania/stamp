/**
 * File: state.ts
 * Purpose: The graph's working memory: typed state channels, with reducers where a node adds to a list.
 * Exports: AgentState, State, StateUpdate, AppIdentity, SectionDraft, Drafts, ProbeResult, appendUnique
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
import type { CheckRecord } from "../services/verification-log.js";
import type { DraftSectionId, SectionOutput } from "./extract/sections.js";
import type { SearchResult } from "./search-result.js";
import type { JudgeMemory } from "./verify/judge-memory.js";

/**
 * The official app the run is about; resolve (stage 0) fills it. `domain` is the primary domain: the guide's
 * domain and the only one the probe may contact. `domains` is every official domain, the primary first, and
 * decides which pages count as official. `product` is the phrase the official page titles agree on, or null.
 */
export type AppIdentity = {
  appName: string;
  domain: string;
  slug: string;
  domains: string[];
  product: string | null;
};

/** One guide section after extract: drafted, not found in the pages, or failed (the reason says why). */
export type SectionDraft<K extends DraftSectionId> =
  | { status: "drafted"; payload: SectionOutput<K> }
  | { status: "unknown" }
  | { status: "failed"; reason: string };

export type Drafts = { [K in DraftSectionId]?: SectionDraft<K> };

/** What the probe found: the endpoint tried, whether it confirmed the claims, the HTTP status and why. */
export type ProbeResult = {
  url: string;
  outcome: ProbeOutcome;
  status: number | null;
  reason: string;
};

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
  /** Keyed by section; a retry pass adds or replaces only the sections it re-extracted. */
  drafts: Annotation<Drafts>({
    reducer: (current, added) => ({ ...current, ...added }),
    default: () => ({}),
  }),
  /** The gates call's facts, each with the claim that backs it; null when unknown or failed. */
  gates: last<SectionOutput<"gates"> | null>(() => null),
  claims: last<Claim[]>(() => []),
  /** The support check's verdicts by claim and quote, kept so the retry pass does not overturn an earlier answer. */
  supportVerdicts: last<JudgeMemory>(() => ({})),
  conflicts: last<Conflict[]>(() => []),
  /** 0 or 1: how many retry passes have started. The graph bumps it when search starts a retry. */
  retryCount: last<number>(() => 0),
  /** Sections with no matched quote after verify; the retry edge fires only while this is non-empty. */
  missingSections: last<string[]>(() => []),
  probeResult: last<ProbeResult | null>(() => null),
  /** Quote and probe checks for the verification log; verify replaces them each pass, probe adds its own. */
  checks: last<CheckRecord[]>(() => []),
  difficulty: last<DifficultyBreakdown | null>(() => null),
  archetype: last<Archetype | null>(() => null),
  guide: last<Guide | null>(() => null),
  /** True when a library guide owns the slug, so the live guide was not stored and the run points at the library. */
  libraryProtected: last<boolean>(() => false),
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
