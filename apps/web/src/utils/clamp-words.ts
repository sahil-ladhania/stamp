/**
 * File: clamp-words.ts
 * Purpose: Cuts text on a word or a clause boundary, never mid-word. CSS `line-clamp` alone can end a line
 *          inside a word ("disco…"), so any text that must be shortened is cut here first.
 * Exports: clampWords, clauseTitle
 * Used by: utils/map-blockers.ts, components/shared/ClampedText.tsx, components/verdict/VerdictRow.tsx
 */

const TRAILING = /[\s,;:\-–—]+$/
const CLAUSE_BREAK = /[,;:]\s|\s[–—-]\s/g
const MIN_CLAUSE_SHARE = 0.4

function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Cuts at the last word that fits and adds an ellipsis. Text that already fits is returned as it is. */
export function clampWords(text: string, max: number): string {
  const clean = tidy(text)
  if (clean.length <= max) return clean
  const head = clean.slice(0, max + 1)
  const lastSpace = head.lastIndexOf(' ')
  // A single very long word has no space to cut at, so it is cut hard rather than overflowing.
  const cut = lastSpace > max * 0.5 ? head.slice(0, lastSpace) : clean.slice(0, max)
  return `${cut.replace(TRAILING, '')}…`
}

/**
 * A short title from a sentence: the first sentence, cut at the last clause break that fits (a comma, semicolon,
 * colon or dash), so the title is a complete phrase. With no clause break it falls back to a word cut.
 */
export function clauseTitle(text: string, max = 90): string {
  const firstSentence = tidy(text).split(/(?<=[.!?])\s/)[0] ?? ''
  const sentence = firstSentence.replace(/[.!?]+$/, '')
  if (sentence.length <= max) return sentence

  let cutAt = -1
  for (const match of sentence.matchAll(CLAUSE_BREAK)) {
    if (match.index <= max && match.index >= max * MIN_CLAUSE_SHARE) cutAt = match.index
  }
  return cutAt > 0 ? sentence.slice(0, cutAt).replace(TRAILING, '') : clampWords(sentence, max)
}
