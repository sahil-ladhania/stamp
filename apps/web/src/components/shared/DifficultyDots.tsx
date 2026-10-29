/**
 * File: DifficultyDots.tsx
 * Purpose: Five dots showing a difficulty score from 1 to 5, with a text equivalent; "Not rated" instead when the guide's review gate is not verified.
 * Exports: DifficultyDots
 * Used by: AppCard, guide header, kit preview
 */
import type { ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { NOT_RATED, difficultyAriaLabel } from '@/utils/difficulty-rating'

type DifficultyDotsProps = {
  score: number
  /** Also print the score, for example "4/5". */
  hasValue?: boolean
  /** False when the review gate is not verified: the dots give way to "Not rated". Defaults to true. */
  isRated?: boolean
  className?: string
}

const DOTS = [1, 2, 3, 4, 5] as const

/** Filled ink dots up to the score. Ink, not red: red belongs to the verdict. */
export function DifficultyDots({ score, hasValue = false, isRated = true, className }: DifficultyDotsProps): ReactElement {
  if (!isRated) {
    return (
      <span role="img" aria-label={difficultyAriaLabel(score, false)} className={cn('inline-flex items-center', className)}>
        <span aria-hidden className="text-data text-ink-muted">
          {NOT_RATED}
        </span>
      </span>
    )
  }
  return (
    <span role="img" aria-label={difficultyAriaLabel(score, true)} className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden className="inline-flex gap-1">
        {DOTS.map((dot) => (
          <span
            key={dot}
            className={cn('size-2.5 rounded-full border border-ink', dot <= score ? 'bg-ink' : 'bg-transparent')}
          />
        ))}
      </span>
      {hasValue && (
        <span aria-hidden className="text-data text-ink">
          {score}/5
        </span>
      )}
    </span>
  )
}
