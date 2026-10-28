/**
 * File: map-guide.test.ts
 * Purpose: Tests the whole guide mapper: the headline, milestones, steps, the section lists, the flat claim list
 *          and the new section's groups, on a full guide and a partial one.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { conflictGuide, partialGuide } from '@/test-support/guide-fixtures'
import { sampleGuide } from '@/test-support/sample-data'
import { mapGuide } from './map-guide'
import { pickEvidenceSample } from './pick-evidence-sample'

const guide = mapGuide(sampleGuide)

describe('mapGuide identity and headline', () => {
  it('keeps the identity fields and the schema values', () => {
    expect(guide).toMatchObject({
      slug: 'example', appName: 'Example', domain: 'example.com', archetype: 'hidden_limits', mode: 'live', coverage: 'full',
    })
  })

  it('takes the headline from the verdict summary and keeps the claim for its label', () => {
    expect(guide.headline).toBe('Text for verdict.summary')
    expect(guide.summary).toMatchObject({ id: 'verdict.summary', label: 'sourced' })
  })

  it('keeps the next step and top blocker ids', () => {
    expect(guide).toMatchObject({ nextStepId: 'steps.0', topBlockerId: 'blockers.0' })
  })
})

describe('mapGuide sections', () => {
  it('lists the two milestones in order with their effort and wait claims', () => {
    expect(guide.milestones.map((milestone) => milestone.id)).toEqual(['firstTest', 'production'])
    expect(guide.milestones[1].wait).toMatchObject({ id: 'milestones.production.wait', label: 'sourced' })
  })

  it('keeps a step’s effort and detail as separate claims', () => {
    expect(guide.steps[0]).toMatchObject({ actor: 'human' })
    expect(guide.steps[0]?.effort.label).toBe('uncertain')
    expect(guide.steps[0]?.detail.label).toBe('sourced')
  })

  it('keeps requirements, scopes and limits as claims', () => {
    expect(guide.requirements.map((claim) => claim.id)).toEqual(['requirements.0'])
    expect(guide.scopes).toMatchObject([{ id: 'scopes.0', name: 'contacts.read' }])
    expect(guide.scopes[0]?.reason.id).toBe('scopes.0.reason')
    expect(guide.limits[0]).toMatchObject({ label: 'uncertain', reason: 'No source found.' })
  })

  it('maps conflicts and blockers', () => {
    expect(mapGuide(conflictGuide).conflicts).toHaveLength(1)
    expect(guide.blockers[0]?.title).toBe('Text for blockers.0.symptom')
  })
})

describe('mapGuide lists', () => {
  it('lists every claim once, in page order, with the verdict first', () => {
    const ids = guide.claims.map((claim) => claim.id)
    expect(ids[0]).toBe('verdict.summary')
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('scopes.0.reason')
    expect(ids).toContain('limits.0')
  })

  it('has the difficulty from the breakdown', () => {
    expect(guide.difficulty).toMatchObject({ score: 4, total: 6 })
  })

  it('lists the unique sources', () => {
    expect(guide.sources.map((source) => source.url)).toEqual(['https://docs.example.com/oauth'])
  })

  it('lists the Uncertain sections of a partial guide', () => {
    expect(mapGuide(partialGuide).uncertainSections).toEqual(['Blockers', 'Source conflicts'])
    expect(mapGuide(partialGuide).coverage).toBe('partial')
  })
})

describe('pickEvidenceSample', () => {
  it('picks the first confirmed claim that has a quote', () => {
    expect(pickEvidenceSample(guide)?.id).toBe('verdict.summary')
  })

  it('is null when no claim is confirmed', () => {
    expect(pickEvidenceSample({ ...guide, claims: guide.claims.filter((claim) => claim.label === 'uncertain') })).toBeNull()
  })
})
