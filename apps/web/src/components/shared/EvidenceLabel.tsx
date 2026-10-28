/**
 * File: EvidenceLabel.tsx
 * Purpose: The only way evidence renders: an icon, a word and a colour for Tested, Sourced or Uncertain.
 * Exports: EvidenceLabel
 * Used by: AppCard-adjacent sections, guide claims, How we verify, Landing
 */
import type { ReactElement, ReactNode } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { EvidenceKind } from '@/types/guide-model'
import { EVIDENCE_META } from '@/utils/evidence'

type EvidenceLabelProps = {
  kind: EvidenceKind
  /** When set, the label is a focusable button and shows this on hover and on focus. */
  detail?: ReactNode
  className?: string
}

/** Pill with icon and word, so colour is never the only signal. */
export function EvidenceLabel({ kind, detail, className }: EvidenceLabelProps): ReactElement {
  const { word, icon: Icon, className: tone } = EVIDENCE_META[kind]
  const pill = cn(
    'inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-stamp-label',
    tone,
    className,
  )
  const content = (
    <>
      <Icon aria-hidden className="size-3.5" />
      <span>{word}</span>
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
