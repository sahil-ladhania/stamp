/**
 * File: archetype.ts
 * Purpose: Display names for the five kinds of hard a guide can show.
 * Exports: ARCHETYPE_LABEL
 * Used by: components/shared/AppCard.tsx, guide and landing sections
 */
import type { Archetype } from '@/mocks/types'

export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  instant: 'Instant',
  'hidden-limits': 'Hidden limits',
  'review-needed': 'Review needed',
  'partner-gated': 'Partner-gated',
  enterprise: 'Enterprise',
}
