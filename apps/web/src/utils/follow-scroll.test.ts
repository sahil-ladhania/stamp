/**
 * File: follow-scroll.test.ts
 * Purpose: Tests the follow-scroll rule: follow at the end, stop on a scroll up, flag unseen rows, and jump back.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from 'vitest'
import {
  FOLLOW_THRESHOLD_PX,
  INITIAL_FOLLOW_STATE,
  distanceBelowViewport,
  followReducer,
  type FollowState,
} from './follow-scroll'

const reading: FollowState = { isFollowing: false, hasUnseen: false }

describe('distanceBelowViewport', () => {
  it('is positive when the end of the list is below the screen and negative when it is above', () => {
    expect(distanceBelowViewport(1200, 900)).toBe(300)
    expect(distanceBelowViewport(700, 900)).toBe(-200)
  })
})

describe('followReducer', () => {
  it('starts following, so the first rows keep the end in view', () => {
    expect(INITIAL_FOLLOW_STATE).toEqual({ isFollowing: true, hasUnseen: false })
  })

  it('stops following when the reader scrolls further than the threshold from the end', () => {
    const next = followReducer(INITIAL_FOLLOW_STATE, { type: 'scrolled', distance: FOLLOW_THRESHOLD_PX + 1 })
    expect(next.isFollowing).toBe(false)
  })

  it('keeps following within the threshold of the end', () => {
    expect(followReducer(INITIAL_FOLLOW_STATE, { type: 'scrolled', distance: FOLLOW_THRESHOLD_PX }).isFollowing).toBe(true)
  })

  it('flags unseen rows only while the reader is not following', () => {
    expect(followReducer(INITIAL_FOLLOW_STATE, { type: 'content-grew' })).toEqual(INITIAL_FOLLOW_STATE)
    expect(followReducer(reading, { type: 'content-grew' })).toEqual({ isFollowing: false, hasUnseen: true })
  })

  it('clears the flag when the reader scrolls back to the end on their own', () => {
    const unseen: FollowState = { isFollowing: false, hasUnseen: true }
    expect(followReducer(unseen, { type: 'scrolled', distance: 10 })).toEqual({ isFollowing: true, hasUnseen: false })
  })

  it('keeps the flag while the reader is still scrolled up', () => {
    const unseen: FollowState = { isFollowing: false, hasUnseen: true }
    expect(followReducer(unseen, { type: 'scrolled', distance: 500 }).hasUnseen).toBe(true)
  })

  it('follows again and clears the flag on a jump', () => {
    expect(followReducer({ isFollowing: false, hasUnseen: true }, { type: 'jumped' })).toEqual(INITIAL_FOLLOW_STATE)
  })
})
