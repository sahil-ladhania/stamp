/**
 * File: follow-scroll.ts
 * Purpose: The rule for a page that follows a growing list: follow the newest row while the reader is at the end, stop when they
 *          scroll up, and remember that rows arrived unseen so the page can offer "Jump to latest". Pure; the hook reads the scroll.
 * Exports: FOLLOW_THRESHOLD_PX, FollowState, FollowAction, INITIAL_FOLLOW_STATE, distanceBelowViewport, followReducer
 * Used by: hooks/useFollowScroll.ts
 */

/** How far below the viewport the end of the list may be and still count as "at the end". */
export const FOLLOW_THRESHOLD_PX = 96

export type FollowState = { isFollowing: boolean; hasUnseen: boolean }

export type FollowAction =
  /** The reader scrolled; `distance` is how far the end of the list is below the viewport. */
  | { type: 'scrolled'; distance: number }
  | { type: 'content-grew' }
  | { type: 'jumped' }

export const INITIAL_FOLLOW_STATE: FollowState = { isFollowing: true, hasUnseen: false }

/** Positive when the end is below the bottom edge of the viewport, negative when it is above it. */
export function distanceBelowViewport(endBottom: number, viewportHeight: number): number {
  return endBottom - viewportHeight
}

export function followReducer(state: FollowState, action: FollowAction): FollowState {
  switch (action.type) {
    case 'scrolled': {
      const isFollowing = action.distance <= FOLLOW_THRESHOLD_PX
      return { isFollowing, hasUnseen: isFollowing ? false : state.hasUnseen }
    }
    case 'content-grew':
      return state.isFollowing ? state : { ...state, hasUnseen: true }
    case 'jumped':
      return INITIAL_FOLLOW_STATE
  }
}
