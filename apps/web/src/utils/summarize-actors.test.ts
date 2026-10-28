/**
 * File: summarize-actors.test.ts
 * Purpose: Tests the actor sentence for steps: all human, mixed, and none.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import { summarizeActors } from './summarize-actors'

const step = (actor: 'human' | 'agent' | 'agent_assist') => ({ actor })

describe('summarizeActors', () => {
  it('says all steps are by you, and that none are by an agent', () => {
    const result = summarizeActors(Array.from({ length: 11 }, () => step('human')))
    expect(result.text).toBe('11 steps: 11 by you, 0 by an agent')
    expect(result).toMatchObject({ total: 11, human: 11, agent: 0, shared: 0 })
  })

  it('adds the shared group only when there is one', () => {
    expect(summarizeActors([step('human'), step('agent'), step('agent_assist')]).text).toBe(
      '3 steps: 1 by you, 1 by an agent, 1 by you and an agent',
    )
  })

  it('uses the singular for one step', () => {
    expect(summarizeActors([step('agent')]).text).toBe('1 step: 0 by you, 1 by an agent')
  })

  it('says so when there are no steps', () => {
    expect(summarizeActors([]).text).toBe('No steps')
  })
})
