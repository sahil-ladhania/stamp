/**
 * File: milestone-durations.test.ts
 * Purpose: Tests that milestone durations come from claim text and are null when none is stated.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { sampleGuide } from '@/test-support/sample-data'
import { mapMilestones } from './map-milestones'
import { milestoneDurations } from './milestone-durations'

function milestonesWith(texts: { fe: string; fw: string; pe: string; pw: string }) {
  const base = sampleGuide.milestones
  const claim = (original: typeof base.firstTest.effort, text: string) => ({ ...original, text })
  return mapMilestones({
    firstTest: { effort: claim(base.firstTest.effort, texts.fe), wait: claim(base.firstTest.wait, texts.fw) },
    production: { effort: claim(base.production.effort, texts.pe), wait: claim(base.production.wait, texts.pw) },
  })
}

describe('milestoneDurations', () => {
  it('reads each duration from its own claim', () => {
    const result = milestoneDurations(
      milestonesWith({ fe: 'Set up takes about 1 hour.', fw: 'No wait.', pe: 'Needs 2 weeks of work.', pw: 'Review takes 3 to 7 days.' }),
    )
    expect(result).toEqual({ firstTest: 'about 1 hour', approvalWait: '3 to 7 days', production: '2 weeks' })
  })

  it('falls back to the first test "waits on" claim, where real guides sometimes put the time', () => {
    const result = milestoneDurations(
      milestonesWith({ fe: 'Use the Quickstart.', fw: 'A page appears in under two minutes.', pe: 'Submit it.', pw: 'Not found.' }),
    )
    expect(result.firstTest).toBe('under two minutes')
  })

  it('is null when the text states no duration', () => {
    const result = milestoneDurations(
      milestonesWith({ fe: 'Configure the consent screen.', fw: 'Not found.', pe: 'Submit the app.', pw: 'Not found.' }),
    )
    expect(result).toEqual({ firstTest: null, approvalWait: null, production: null })
  })
})
