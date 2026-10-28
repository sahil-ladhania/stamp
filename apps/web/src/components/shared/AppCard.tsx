/**
 * File: AppCard.tsx
 * Purpose: A library guide as a card: app name, difficulty, what its kind of hard means, as-of date.
 * Exports: AppCard
 * Used by: App home library list, Landing, Not found
 */
import type { GuideSummary } from '@stamp/schema'
import type { ReactElement } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { ARCHETYPE_BLURB, ARCHETYPE_LABEL } from '@/utils/archetype'
import { formatAsOf } from '@/utils/format-date'
import { AppIcon } from './AppIcon'
import { DifficultyDots } from './DifficultyDots'

type AppCardProps = { guide: GuideSummary; className?: string }

/** The whole card is one link. Hover raises the border colour only. */
export function AppCard({ guide, className }: AppCardProps): ReactElement {
  return (
    <Link
      to={`/g/${guide.slug}`}
      className={cn(
        'flex h-full flex-col gap-3 rounded-md border border-rule bg-card p-card transition-colors hover:border-ink-muted',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-card-title text-ink">
          <AppIcon slug={guide.slug} className="text-ink-muted" />
          {guide.appName}
        </h3>
        <DifficultyDots score={guide.difficulty} hasValue className="pt-1" />
      </div>
      <p className="text-body text-ink-muted">{ARCHETYPE_BLURB[guide.archetype]}</p>
      <p className="mt-auto flex flex-wrap gap-x-2 pt-1 text-small text-ink-muted">
        <span className="text-data text-ink">{ARCHETYPE_LABEL[guide.archetype]}</span>
        <span aria-hidden>·</span>
        <span>As of {formatAsOf(guide.asOf)}</span>
      </p>
    </Link>
  )
}
