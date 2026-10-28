/**
 * File: EvidenceLabel.tsx
 * Purpose: The static form of an evidence label: an icon, a word and a colour for Tested, Sourced or Uncertain, with an
 *          optional source count and a compact size. The interactive form is components/evidence/EvidenceBadge.tsx.
 * Exports: EvidenceLabel
 * Used by: Live run trace, evidence definitions, verify page, library cells, evidence panel
 */
import type { ReactElement, ReactNode } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { EvidenceKind } from '@/types/guide-model'
import { EVIDENCE_META, evidencePillClass, type EvidenceSize } from '@/utils/evidence'

type EvidenceLabelProps = {
  kind: EvidenceKind
  /** When set, the label is a focusable button and shows this on hover and on focus. */
  detail?: ReactNode
  /** The number of sources behind the claim, shown after the word. */
  count?: number
  size?: EvidenceSize
  className?: string
}

/** Pill with icon and word, so colour is never the only signal. */
export function EvidenceLabel({ kind, detail, count, size = 'md', className }: EvidenceLabelProps): ReactElement {
  const { word, icon: Icon, className: tone } = EVIDENCE_META[kind]
  const pill = cn(evidencePillClass(size), tone, className)
  const content = (
    <>
      <Icon aria-hidden className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      <span>{word}</span>
      {count ? <span aria-hidden>· {count}</span> : null}
    </>
  )
  if (!detail) {
    return <span className={pill}>{content}</span>
  }
  return (
    <Tooltip content={detail}>
      <button type="button" className={cn(pill, 'transition-colors hover:border-current')}>
        {content}
      </button>
    </Tooltip>
  )
}
