/**
 * File: map-difficulty.ts
 * Purpose: Maps the wire difficulty (a score plus four numbers) to the UI breakdown. Each factor's reason is the
 *          rule's own words for those points, read from the display copy of the rule.
 * Exports: mapDifficulty
 * Used by: utils/map-guide.ts
 */
import type { Guide as WireGuide } from '@stamp/schema'
import { DIFFICULTY_FACTORS } from '@/content/difficulty-rule'
import type { Difficulty, DifficultyFactor } from '@/types/guide-model'

type BreakdownKey = 'reviewGate' | 'approvalWait' | 'prerequisites' | 'hiddenLimits'

/** In the order the rule table lists them. `name` is the join key into DIFFICULTY_FACTORS. */
const FACTORS: readonly { key: BreakdownKey; name: string }[] = [
  { key: 'reviewGate', name: 'Review gate' },
  { key: 'approvalWait', name: 'Approval wait' },
  { key: 'prerequisites', name: 'Prerequisites' },
  { key: 'hiddenLimits', name: 'Hidden limits' },
]

function mapFactor(
  { key, name }: (typeof FACTORS)[number],
  breakdown: WireGuide['difficultyBreakdown'],
): DifficultyFactor {
  const rule = DIFFICULTY_FACTORS.find((factor) => factor.name === name)
  const levels = rule?.cells.filter((cell) => cell !== null).length ?? 1
  const points = breakdown[key]
  return { name, points, max: levels - 1, reason: rule?.cells[points] ?? 'Not used' }
}

export function mapDifficulty(guide: WireGuide): Difficulty {
  const { difficultyBreakdown: breakdown } = guide
  return {
    // The top-level score is the API's own column; the breakdown's score is checked to equal it by the schema.
    score: guide.difficulty,
    total: breakdown.total,
    factors: FACTORS.map((factor) => mapFactor(factor, breakdown)),
  }
}
