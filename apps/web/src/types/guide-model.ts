/**
 * File: guide-model.ts
 * Purpose: The shapes the guide components render. A guide from @stamp/schema is mapped into these by the
 *          utils/map-*.ts mappers, so a component never reads the wire shape. Wire values (archetype, actor,
 *          tier) are the schema's own.
 * Exports: EvidenceKind, Source, Claim, Milestone, Step, Blocker, ConflictOption, Conflict, Scope,
 *          DifficultyFactor, Difficulty, Guide
 * Used by: components/guide/*, components/shared/*, components/landing/*, components/verify/*, utils/map-*.ts
 */
import type {
  Actor,
  Archetype,
  EvidenceLabel,
  GuideCoverage,
  GuideMode,
  SourceTier,
} from '@stamp/schema'

export type EvidenceKind = EvidenceLabel

export type Source = {
  url: string
  /** Derived from the URL: the wire source has no title. */
  title: string
  tier: SourceTier
  /** The verbatim quote. Absent only on editorial examples. */
  quote?: string
  /** When the page was read, as an ISO date-time. */
  retrievedAt?: string
  /** How many claims cite this source. Only set on the guide's top-level source list. */
  usedBy?: number
}

export type Claim = {
  /** Stable path inside the guide, for example `steps.3.detail`. It is what a report names. */
  id: string
  text: string
  label: EvidenceKind
  sources: Source[]
  /** Why an Uncertain claim has nothing behind it. Only set when it has no source at all. */
  reason?: string
}

export type Milestone = {
  id: 'firstTest' | 'production'
  title: string
  /** How long it takes. */
  effort: Claim
  /** What it waits on. */
  wait: Claim
}

export type Step = {
  id: string
  title: string
  actor: Actor
  effort: Claim
  detail: Claim
}

export type Blocker = {
  id: string
  /** Derived from the symptom: the wire blocker has no title. */
  title: string
  symptom: Claim
  cause: Claim
  fix: Claim
  contact: Claim | null
}

export type ConflictOption = { source: Source; isTrusted: boolean }

export type Conflict = {
  id: string
  topic: string
  options: [ConflictOption, ConflictOption]
  /** Which source Stamp trusts and why, or why it trusts neither. */
  reason: Claim
}

export type Scope = { id: string; name: string; reason: Claim }

export type DifficultyFactor = { name: string; points: number; max: number; reason: string }

export type Difficulty = {
  score: number
  total: number
  factors: DifficultyFactor[]
}

export type Guide = {
  slug: string
  appName: string
  domain: string
  /** The product phrase the run searched for ("Gmail API"); absent for a guide made before it was kept, or when there was none. */
  product?: string | null
  archetype: Archetype
  mode: GuideMode
  coverage: GuideCoverage
  /** ISO date-time, for example `2026-10-28T09:30:00.000Z`. */
  asOf: string
  /** The verdict summary text, shown as the headline. */
  headline: string
  /** The verdict summary claim, so the headline carries its label. */
  summary: Claim
  difficulty: Difficulty
  milestones: [Milestone, Milestone]
  nextStepId: string | null
  topBlockerId: string | null
  requirements: Claim[]
  scopes: Scope[]
  limits: Claim[]
  steps: Step[]
  blockers: Blocker[]
  conflicts: Conflict[]
  /** Unique sources across every claim, official first. */
  sources: Source[]
  /** Every claim in the guide, for the verification counts. */
  claims: Claim[]
  /** Section names that are Uncertain, shown on a partial guide. */
  uncertainSections: string[]
}
