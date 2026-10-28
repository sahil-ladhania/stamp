/**
 * File: map-claim.ts
 * Purpose: Maps a wire claim to the UI claim. The label, text, id and sources are kept as the API set them;
 *          the web app never changes a label. An Uncertain claim with no source gets a plain reason.
 * Exports: NO_SOURCE_REASON, mapClaim
 * Used by: utils/map-*.ts
 */
import type { Claim as WireClaim } from '@stamp/schema'
import type { Claim } from '@/types/guide-model'
import { mapSource } from './map-source'

export const NO_SOURCE_REASON = 'No source found.'

export function mapClaim(claim: WireClaim): Claim {
  const hasNoSource = claim.label === 'uncertain' && claim.sources.length === 0
  return {
    id: claim.id,
    text: claim.text,
    label: claim.label,
    sources: claim.sources.map(mapSource),
    ...(hasNoSource ? { reason: NO_SOURCE_REASON } : {}),
  }
}
