/**
 * File: useFollowScroll.ts
 * Purpose: Makes the page follow a growing list. While the reader is at the end, each new row scrolls into view; if they scroll up it
 *          stops and reports that rows arrived unseen, and `jumpToLatest` takes them back. When the run ends while the page is following,
 *          it scrolls to the top, where the result is. Instant under reduced motion; the page scrolls, there is no inner scroll box.
 * Exports: useFollowScroll
 * Used by: components/run/RunScreen.tsx
 */
import { useCallback, useEffect, useReducer, useRef, type RefObject } from 'react'
import {
  INITIAL_FOLLOW_STATE,
  distanceBelowViewport,
  followReducer,
} from '@/utils/follow-scroll'
import { useReducedMotion } from './useReducedMotion'

const SMOOTH_SETTLE_MS = 700 // Scroll events during our own smooth scroll are not the reader leaving the end.

type FollowScroll = {
  /** Put this on an empty element after the last row. */
  endRef: RefObject<HTMLDivElement | null>
  hasUnseen: boolean
  jumpToLatest: () => void
}

/** `isActive` is true while the run is live; `rowCount` is how many rows the list has. */
export function useFollowScroll(isActive: boolean, rowCount: number): FollowScroll {
  const endRef = useRef<HTMLDivElement>(null)
  const [state, dispatch] = useReducer(followReducer, INITIAL_FOLLOW_STATE)
  const isReduced = useReducedMotion()
  const ignoreUntil = useRef(0)
  const previousCount = useRef(rowCount)
  const wasActive = useRef(isActive)

  useEffect(() => {
    if (!isActive) return
    function onScroll(): void {
      const end = endRef.current
      if (!end || performance.now() < ignoreUntil.current) return
      dispatch({ type: 'scrolled', distance: distanceBelowViewport(end.getBoundingClientRect().bottom, window.innerHeight) })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [isActive])

  useEffect(() => {
    const grew = rowCount > previousCount.current
    previousCount.current = rowCount
    if (!isActive || !grew) return
    dispatch({ type: 'content-grew' })
    if (state.isFollowing) endRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' })
  }, [rowCount, isActive, state.isFollowing])

  useEffect(() => {
    const justEnded = wasActive.current && !isActive
    wasActive.current = isActive
    if (justEnded && state.isFollowing) window.scrollTo({ top: 0, behavior: isReduced ? 'auto' : 'smooth' })
  }, [isActive, state.isFollowing, isReduced])

  const jumpToLatest = useCallback(() => {
    if (!isReduced) ignoreUntil.current = performance.now() + SMOOTH_SETTLE_MS
    dispatch({ type: 'jumped' })
    endRef.current?.scrollIntoView({ block: 'end', behavior: isReduced ? 'auto' : 'smooth' })
  }, [isReduced])

  return { endRef, hasUnseen: state.hasUnseen, jumpToLatest }
}
