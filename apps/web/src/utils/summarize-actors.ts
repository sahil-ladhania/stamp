/**
 * File: summarize-actors.ts
 * Purpose: One sentence that says who does the steps, so the count explains itself ("11 steps: 11 by you, 0 by an agent").
 * Exports: ActorSummary, summarizeActors
 * Used by: components/guide/ActorSummary.tsx
 */
import type { Actor } from '@stamp/schema'

export type ActorSummary = {
  total: number
  human: number
  agent: number
  shared: number
  text: string
}

export function summarizeActors(steps: readonly { actor: Actor }[]): ActorSummary {
  const count = (actor: Actor): number => steps.filter((step) => step.actor === actor).length
  const total = steps.length
  const human = count('human')
  const agent = count('agent')
  const shared = count('agent_assist')
  if (total === 0) return { total, human, agent, shared, text: 'No steps' }

  const parts = [`${human} by you`, `${agent} by an agent`]
  if (shared > 0) parts.push(`${shared} by you and an agent`)
  return { total, human, agent, shared, text: `${total} ${total === 1 ? 'step' : 'steps'}: ${parts.join(', ')}` }
}
