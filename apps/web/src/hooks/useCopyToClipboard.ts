/**
 * File: useCopyToClipboard.ts
 * Purpose: Copies text to the clipboard and reports for a moment that it worked.
 * Exports: useCopyToClipboard
 * Used by: components/shared/CopyButton.tsx
 */
import { useEffect, useRef, useState } from 'react'

const CONFIRM_MS = 1500

export function useCopyToClipboard(): { isCopied: boolean; copy: (text: string) => Promise<boolean> } {
  const [isCopied, setIsCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard access can be blocked by the browser or by a missing secure context.
      return false
    }
    setIsCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setIsCopied(false), CONFIRM_MS)
    return true
  }

  return { isCopied, copy }
}
