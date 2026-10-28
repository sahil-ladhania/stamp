/**
 * File: is-unknown-claim.ts
 * Purpose: True for the claim that stands in for an unknown fact: Uncertain, with no source. Its text says what is unknown.
 * Exports: isUnknownClaim
 * Used by: components/shared/UnknownValue.tsx, utils/verdict.ts, components/guide/*
 */
import type { Claim } from '@/types/guide-model'

export function isUnknownClaim(claim: Pick<Claim, 'label' | 'sources'>): boolean {
  return claim.label === 'uncertain' && claim.sources.length === 0
}
