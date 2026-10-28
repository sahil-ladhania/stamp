/**
 * File: types.ts
 * Purpose: TEMPORARY mock-phase types for guides, claims and run events. They mirror
 *          docs/solution.md, docs/api-design.md and docs/design-system.md, and will be
 *          replaced by the types exported from @stamp/schema once the schema ships.
 * Exports: EvidenceKind, Archetype, GuideMode, GuideStatus, Actor, SourceTier, Source, Claim,
 *          Milestone, Step, Blocker, ConflictOption, Conflict, DifficultyFactor, Difficulty,
 *          Guide, GuideSummary, RunErrorCode, RunEvent, TimedRunEvent
 * Used by: mocks/*, components/shared/*, utils/evidence.ts, utils/archetype.ts, pages/*
 */

import type { Actor, Archetype, RunErrorCode, SourceTier } from '@stamp/schema'
import type { RunViewEvent } from '@/utils/run-view'

// The run vocabulary comes from @stamp/schema; the guide types below move over in Phase 2.
export type { Actor, Archetype, RunErrorCode, SourceTier }

export type EvidenceKind = 'tested' | 'sourced' | 'uncertain'
export type GuideMode = 'library' | 'live'
export type GuideStatus = 'full' | 'partial' | 'not-oauth' | 'no-docs'

export type Source = {
  url: string
  title: string
  tier: SourceTier
  /** Verbatim quote. Optional: mocks have none because the docs hold none. */
  quote?: string
}

export type Claim = {
  /** Stable path inside the guide, for example `steps.3`. */
  id: string
  text: string
  label: EvidenceKind
  sources: Source[]
  /** Why a claim is Uncertain, in the UI voice ("Quote not found in source"). */
  reason?: string
}

export type Milestone = {
  id: 'first-test' | 'production'
  title: string
  duration: string
  wait: string
  claims: Claim[]
}

export type Step = {
  id: string
  title: string
  actor: Actor
  effort: string
  /** Null renders as "Unknown". */
  detail: string | null
  claim: Claim
}

export type Blocker = {
  id: string
  title: string
  symptom: string
  cause: string
  /** Null renders as "Unknown". */
  fix: string | null
  contact: string | null
  claim: Claim
}

export type ConflictOption = { claim: Claim; isTrusted: boolean }

export type Conflict = {
  id: string
  topic: string
  options: ConflictOption[]
  /** Which source Stamp trusts and why, or why it trusts neither. */
  reason: string
}

export type DifficultyFactor = { name: string; points: number; max: number; reason: string }

export type Difficulty = {
  score: 1 | 2 | 3 | 4 | 5
  total: number
  label: EvidenceKind
  factors: DifficultyFactor[]
}

export type Guide = {
  slug: string
  appName: string
  archetype: Archetype
  mode: GuideMode
  status: GuideStatus
  /** ISO date, for example `2026-10-28`. */
  asOf: string
  /** One line on what catches developers. Not in the list endpoint yet. */
  headline: string
  difficulty: Difficulty
  milestones: [Milestone, Milestone]
  nextStepId: string
  topBlockerId: string
  steps: Step[]
  blockers: Blocker[]
  conflicts: Conflict[]
  sources: Source[]
  /** Section names that are Uncertain, shown on a partial guide. */
  uncertainSections: string[]
}

export type GuideSummary = Pick<
  Guide,
  'slug' | 'appName' | 'archetype' | 'mode' | 'asOf' | 'headline'
> & { difficulty: Difficulty['score'] }

/** A run progress event as the Live run page reads it (the schema event without its run id). */
export type RunEvent = RunViewEvent

/** A run event with the time, in ms from run start, at which the mock playback emits it. */
export type TimedRunEvent = { atMs: number; event: RunEvent }
