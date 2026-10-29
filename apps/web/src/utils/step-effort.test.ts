/**
 * File: step-effort.test.ts
 * Purpose: Tests how a step's effort reads in its meta row: unknown, a stated duration, or a few words cut on a word.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import type { Claim } from '@/types/guide-model'
import { describeEffort } from './step-effort'

const source = { url: 'https://docs.example.com/a', title: 't', tier: 'official' as const }
const claim = (text: string, sources: Claim['sources'] = [source], label: Claim['label'] = 'uncertain'): Claim => ({
  id: 'steps.0.effort',
  text,
  label,
  sources,
})

describe('describeEffort', () => {
  it('says not stated for the unknown claim: Uncertain with no source', () => {
    expect(describeEffort(claim('Not found in the fetched sources.', []))).toEqual({ kind: 'unknown' })
  })

  it('reads a stated duration out of the text', () => {
    expect(describeEffort(claim('Registration takes about 2 hours.'))).toEqual({ kind: 'duration', text: 'about 2 hours' })
  })

  it('keeps a few words, cut on a word, when the text states no duration', () => {
    const result = describeEffort(claim('Depends on how many teammates must approve the request before you can continue with the setup'))
    expect(result.kind).toBe('words')
    expect(result.kind === 'words' && result.text.endsWith('…')).toBe(true)
    expect(result.kind === 'words' && result.text.length).toBeLessThanOrEqual(41)
  })

  it('treats a sourced claim with no duration as words, not unknown', () => {
    expect(describeEffort(claim('A few clicks.', [source], 'sourced')).kind).toBe('words')
  })
})
