/**
 * File: map-difficulty.test.ts
 * Purpose: Tests the difficulty mapper: factors in rule order, points and limits from the breakdown, and reasons from the rule.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { guideWith } from '@/test-support/guide-fixtures'
import { sampleGuide } from '@/test-support/sample-data'
import { mapDifficulty } from './map-difficulty'

describe('mapDifficulty', () => {
  const difficulty = mapDifficulty(sampleGuide)

  it('keeps the score and the total', () => {
    expect(difficulty).toMatchObject({ score: 4, total: 6 })
  })

  it('lists the four factors in the order of the rule table', () => {
    expect(difficulty.factors.map((factor) => factor.name)).toEqual([
      'Review gate', 'Approval wait', 'Prerequisites', 'Hidden limits',
    ])
  })

  it('takes each factor’s points from the breakdown', () => {
    expect(difficulty.factors.map((factor) => factor.points)).toEqual([2, 2, 1, 1])
  })

  it('takes the highest points a factor can have from the rule', () => {
    expect(difficulty.factors.map((factor) => factor.max)).toEqual([3, 3, 2, 1])
  })

  it('words each reason with the rule’s text for those points', () => {
    expect(difficulty.factors.map((factor) => factor.reason)).toEqual([
      'Required to scale',
      '1 to 4 weeks, or unknown',
      '1',
      '1 or more',
    ])
  })

  it('maps the lowest and highest scores', () => {
    const easy = guideWith({
      difficulty: 1,
      difficultyBreakdown: { reviewGate: 0, approvalWait: 0, prerequisites: 0, hiddenLimits: 0, total: 0, score: 1 },
    })
    const hard = guideWith({
      difficulty: 5,
      difficultyBreakdown: { reviewGate: 3, approvalWait: 3, prerequisites: 2, hiddenLimits: 0, total: 8, score: 5 },
    })
    expect(mapDifficulty(easy).factors.map((factor) => factor.reason)).toEqual([
      'None', 'Under 1 day', 'None', 'None',
    ])
    expect(mapDifficulty(hard).factors[0]?.reason).toBe('Security assessment or partner vetting')
  })
})
