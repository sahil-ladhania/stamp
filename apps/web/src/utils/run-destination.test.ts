/**
 * File: run-destination.test.ts
 * Purpose: Tests where each start-run result sends the visitor.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { getRunDestination } from './run-destination'

describe('getRunDestination', () => {
  it('opens the guide for a cached result', () => {
    expect(getRunDestination({ status: 'cached', slug: 'hubspot' }, 'HubSpot')).toBe('/g/hubspot')
  })

  it('opens the live run for a started run, with the typed name', () => {
    expect(getRunDestination({ status: 'started', runId: 'run_123' }, 'Notion')).toBe(
      '/run/run_123?app=Notion',
    )
  })

  it('opens the same page when joining a run already in progress', () => {
    expect(getRunDestination({ status: 'running', runId: 'run_122' }, 'Notion')).toBe(
      '/run/run_122?app=Notion',
    )
  })

  it('encodes the typed name and the ids', () => {
    expect(getRunDestination({ status: 'started', runId: 'run_1' }, 'Acme & Co/CRM')).toBe(
      '/run/run_1?app=Acme%20%26%20Co%2FCRM',
    )
  })
})
