/**
 * File: archetype.ts
 * Purpose: Display names and one-line blurbs for the kinds of hard a guide can show. The blurbs describe Stamp's
 *          own categories (the classifier in apps/api), never a provider fact, so a list row needs no headline from the API.
 * Exports: ARCHETYPE_LABEL, ARCHETYPE_BLURB
 * Used by: components/shared/AppCard.tsx, components/app-home/LibraryRow.tsx, guide and landing sections
 */
import type { Archetype } from '@stamp/schema'

export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  instant: 'Instant',
  hidden_limits: 'Hidden limits',
  review: 'Review needed',
  partner_gated: 'Partner-gated',
  enterprise: 'Enterprise',
  unknown: 'Unknown',
}

export const ARCHETYPE_BLURB: Record<Archetype, string> = {
  instant: 'No required review. You can connect straight away.',
  hidden_limits: 'Easy to start, with limits that show up later.',
  review: 'A review or assessment is required before you can scale.',
  partner_gated: 'Access needs partner vetting.',
  enterprise: 'Needs an enterprise plan.',
  unknown: 'Stamp could not verify the gates for this app.',
}
