/**
 * File: useActiveSection.ts
 * Purpose: Follows the scroll and reports which section (by element id) is current, for the section navigation.
 * Exports: useActiveSection
 * Used by: components/nav/SectionNav.tsx
 */
import { useEffect, useState } from 'react'
import { pickActiveSection } from '@/utils/active-section'

const DEFAULT_OFFSET = 120 // The header height plus some air, so a section counts a little before it reaches the top.

/** `ids` are element ids. The first one is active until the scroll reaches the second. */
export function useActiveSection(ids: readonly string[], offset = DEFAULT_OFFSET): string | null {
  const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null)
  const key = ids.join('|')

  useEffect(() => {
    const list = key === '' ? [] : key.split('|')
    let frame = 0
    function update(): void {
      frame = 0
      const tops = list.flatMap((id) => {
        const element = document.getElementById(id)
        return element ? [{ id, top: element.getBoundingClientRect().top }] : []
      })
      setActiveId(pickActiveSection(tops, offset))
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
  }, [key, offset])

  return activeId
}
