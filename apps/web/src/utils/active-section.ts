/**
 * File: active-section.ts
 * Purpose: Pure scroll maths: which section is current, and how far a scroll-driven list has progressed.
 * Exports: SectionTop, pickActiveSection, scrollProgress
 * Used by: hooks/useActiveSection.ts, hooks/useScrollSteps.ts
 */

export type SectionTop = { id: string; top: number }

/** The last section whose top has reached `offset`; the first section before any has. Null for no sections. */
export function pickActiveSection(sections: readonly SectionTop[], offset: number): string | null {
  let active = sections[0]?.id ?? null
  for (const section of sections) {
    if (section.top <= offset) active = section.id
  }
  return active
}

/** 0 when `line` is above the first top, 1 at or below the last, linear in between. */
export function scrollProgress(firstTop: number, lastTop: number, line: number): number {
  if (lastTop <= firstTop) return 0
  return Math.min(1, Math.max(0, (line - firstTop) / (lastTop - firstTop)))
}
