/**
 * File: useScrollSteps.ts
 * Purpose: For a list of tall panels read while scrolling: which panel is current, and how far the scroll has
 *          progressed through them (0 to 1), for the Landing stepper. Does nothing when disabled.
 * Exports: useScrollSteps
 * Used by: components/landing/HowItWorksStepper.tsx
 */
import { useEffect, useState } from 'react'
import { pickActiveSection, scrollProgress } from '@/utils/active-section'

const READ_LINE = 0.45 // The point of the viewport, from the top, that decides the current panel.

export function useScrollSteps(
  ids: readonly string[],
  isEnabled: boolean,
): { activeIndex: number; progress: number } {
  const [state, setState] = useState({ activeIndex: 0, progress: 0 })
  const key = ids.join('|')

  useEffect(() => {
    if (!isEnabled) return
    const list = key.split('|')
    let frame = 0
    function update(): void {
      frame = 0
      const line = window.innerHeight * READ_LINE
      const tops = list.flatMap((id) => {
        const element = document.getElementById(id)
        return element ? [{ id, top: element.getBoundingClientRect().top }] : []
      })
      const first = tops[0]
      const last = tops.at(-1)
      if (!first || !last) return
      const activeId = pickActiveSection(tops, line)
      setState({
        activeIndex: Math.max(0, list.indexOf(activeId ?? first.id)),
        progress: scrollProgress(first.top, last.top, line),
      })
    }
    function schedule(): void {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.cancelAnimationFrame(frame)
    }
  }, [key, isEnabled])

  return state
}
