/**
 * File: downgrade-reason.ts
 * Purpose: UI wording for why a claim was downgraded to Uncertain (the `claim.downgraded` reason).
 * Exports: DOWNGRADE_REASON_LABEL
 * Used by: utils/run-view.ts
 */
import type { DowngradeReason } from '@stamp/schema'

export const DOWNGRADE_REASON_LABEL: Record<DowngradeReason, string> = {
  quote_not_found: 'Quote not found in the page',
  sources_disagree: 'Sources disagree',
  stale_source: 'Source is out of date',
  schema_failed: 'Output did not match the expected format',
  time_budget: 'Ran out of time',
  off_product: "This page is about a different product, not this app's API",
  not_supported: 'The quote does not say what the claim says',
  third_party_only: 'Only a third-party page says this, not the provider',
}
