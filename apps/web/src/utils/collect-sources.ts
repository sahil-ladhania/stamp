/**
 * File: collect-sources.ts
 * Purpose: The guide's top-level source list: every source behind every claim and every conflict, once each
 *          (by URL), with how many claims cite it, official first, then third party, then forum, and by first appearance
 *          within a tier.
 * Exports: collectSources
 * Used by: utils/map-guide.ts
 */
import type { Guide, SourceTier } from '@stamp/schema'
import type { Source } from '@/types/guide-model'
import { listGuideClaims } from './guide-claims'
import { mapSource } from './map-source'

const TIER_RANK: Record<SourceTier, number> = { official: 0, third_party: 1, forum: 2 }

export function collectSources(guide: Guide): Source[] {
  const wire = [
    // A claim that cites a URL twice still counts once.
    ...listGuideClaims(guide).flatMap((claim) => [...new Map(claim.sources.map((source) => [source.url, source])).values()]),
    ...guide.conflicts.flatMap((conflict) => [conflict.sourceA, conflict.sourceB]),
  ]
  const unique = new Map<string, Source>()
  for (const source of wire) {
    const known = unique.get(source.url)
    if (known) known.usedBy = (known.usedBy ?? 0) + 1
    else unique.set(source.url, { ...mapSource(source), usedBy: 1 })
  }
  // Array.sort is stable, so first appearance still orders sources of the same tier.
  return [...unique.values()].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])
}
