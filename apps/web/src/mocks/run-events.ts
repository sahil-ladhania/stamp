/**
 * File: run-events.ts
 * Purpose: One mock live run, replayed from stage 0 to run.done. It is a HubSpot run so every
 *          URL comes from the docs. Timings are compressed for the demo (a real run has 120 s).
 * Exports: MOCK_RUN_ID, MOCK_RUN_EVENTS
 * Used by: hooks/useMockSearch.ts, Live run page (useMockPlayback)
 */
import { RUN_STAGES } from '@/utils/run-stages'
import { SOURCES } from './sources'
import type { RunEvent, TimedRunEvent } from './types'

export const MOCK_RUN_ID = 'run_demo'

const { hubspotChangelog, hubspotForum, composioCustomVsManaged, composioCustomAuth } = SOURCES

function at(atMs: number, event: RunEvent): TimedRunEvent {
  return { atMs, event }
}

function stageName(stage: number): string {
  return RUN_STAGES.find((item) => item.stage === stage)?.name ?? `Stage ${stage}`
}

function started(atMs: number, stage: number): TimedRunEvent {
  return at(atMs, { type: 'stage.started', stage, name: stageName(stage) })
}

function done(atMs: number, stage: number, durationMs: number): TimedRunEvent {
  return at(atMs, { type: 'stage.done', stage, durationMs })
}

export const MOCK_RUN_EVENTS: readonly TimedRunEvent[] = [
  started(0, 0),
  done(600, 0, 600),
  started(700, 1),
  done(1700, 1, 1000),
  started(1800, 2),
  at(2200, { type: 'search.query', query: 'hubspot new marketplace distribution app install limits' }),
  at(2800, { type: 'search.query', query: 'hubspot ai connector legacy public app install limitation' }),
  at(3400, { type: 'search.query', query: 'composio hubspot custom auth config callback url' }),
  done(4000, 2, 2200),
  started(4100, 3),
  at(4800, { type: 'page.fetched', url: hubspotChangelog.url, tier: hubspotChangelog.tier }),
  at(5500, { type: 'page.fetched', url: hubspotForum.url, tier: hubspotForum.tier }),
  at(6200, { type: 'page.fetched', url: composioCustomVsManaged.url, tier: composioCustomVsManaged.tier }),
  at(6900, { type: 'page.fetched', url: composioCustomAuth.url, tier: composioCustomAuth.tier }),
  done(7300, 3, 3200),
  started(7400, 4),
  done(10000, 4, 2600),
  started(10100, 5),
  at(10600, { type: 'claim.verified', claimId: 'steps.7', url: hubspotChangelog.url }),
  at(11000, { type: 'claim.verified', claimId: 'blockers.1', url: hubspotChangelog.url }),
  at(11400, { type: 'claim.verified', claimId: 'blockers.2', url: hubspotForum.url }),
  at(11800, { type: 'claim.downgraded', claimId: 'milestones.first-test', reason: 'quote_not_found' }),
  at(12200, { type: 'claim.downgraded', claimId: 'steps.4', reason: 'sources_disagree' }),
  done(12600, 5, 2500),
  started(12700, 6),
  done(13500, 6, 800),
  started(13600, 7),
  done(14000, 7, 400),
  started(14100, 8),
  done(14500, 8, 400),
  at(14600, { type: 'run.done', slug: 'hubspot', status: 'done' }),
]
