/**
 * File: step-effort.ts
 * Purpose: How a step's effort reads in the quiet meta row of a step ("Human · 2 hours"): the duration its text states in mono, a few words
 *          cut on a word, or "not stated" when the claim is the unknown one. The effort's own label is shown in the open step, not here.
 * Exports: StepEffort, describeEffort
 * Used by: components/guide/StepRow.tsx
 */
import type { Claim } from './../types/guide-model'
import { clampWords } from './clamp-words'
import { extractDuration } from './extract-duration'
import { isUnknownClaim } from './is-unknown-claim'

export type StepEffort = { kind: 'unknown' } | { kind: 'duration'; text: string } | { kind: 'words'; text: string }

export function describeEffort(claim: Claim): StepEffort {
  if (isUnknownClaim(claim)) return { kind: 'unknown' }
  const duration = extractDuration(claim.text)
  return duration ? { kind: 'duration', text: duration } : { kind: 'words', text: clampWords(claim.text, 40) }
}
