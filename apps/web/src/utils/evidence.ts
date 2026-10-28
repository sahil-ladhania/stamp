/**
 * File: evidence.ts
 * Purpose: Single source for the three evidence labels: word, icon, colour classes and meaning.
 * Exports: EVIDENCE_KINDS, EVIDENCE_META
 * Used by: components/shared/EvidenceLabel.tsx, How we verify and Landing sections
 */
import { Check, CircleHelp, Link as LinkIcon, type LucideIcon } from 'lucide-react'
import type { EvidenceKind } from '@/types/guide-model'

type EvidenceMeta = {
  word: string
  icon: LucideIcon
  /** Token classes only; colour is never the sole signal (icon and word always render). */
  className: string
  meaning: string
  howSet: string
}

export const EVIDENCE_KINDS: readonly EvidenceKind[] = ['tested', 'sourced', 'uncertain']

// Meanings come from docs/solution.md section 5.
export const EVIDENCE_META: Record<EvidenceKind, EvidenceMeta> = {
  tested: {
    word: 'Tested',
    icon: Check,
    className: 'bg-tested-bg text-tested',
    meaning: 'We ran it and logged the result',
    howSet: 'An endpoint check or a manual setup attempt',
  },
  sourced: {
    word: 'Sourced',
    icon: LinkIcon,
    className: 'bg-sourced-bg text-sourced',
    meaning: 'A source page says it, word for word',
    howSet: 'Code checks that the quote appears in the fetched page',
  },
  uncertain: {
    word: 'Uncertain',
    icon: CircleHelp,
    className: 'bg-uncertain-bg text-uncertain',
    meaning: 'Not confirmed',
    howSet: 'No quote match, sources disagree, or only an old source exists',
  },
}
