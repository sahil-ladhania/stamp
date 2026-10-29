/**
 * File: downgrade-reason.test.ts
 * Purpose: Tests that every downgrade reason the schema allows has wording on the live run page.
 * Exports: (none)
 * Used by: vitest
 */
import { DowngradeReasonSchema } from '@stamp/schema'
import { describe, expect, it } from 'vitest'
import { DOWNGRADE_REASON_LABEL } from './downgrade-reason'

describe('DOWNGRADE_REASON_LABEL', () => {
  it.each(DowngradeReasonSchema.options)('has wording for %s', (reason) => {
    expect(DOWNGRADE_REASON_LABEL[reason].length).toBeGreaterThan(8)
  })

  it('says what is wrong with the page or the quote for each new reason', () => {
    expect(DOWNGRADE_REASON_LABEL.off_product).toMatch(/product/i)
    expect(DOWNGRADE_REASON_LABEL.not_supported).toMatch(/support|say/i)
    expect(DOWNGRADE_REASON_LABEL.third_party_only).toMatch(/third.party|official/i)
  })
})
