/**
 * File: Wordmark.tsx
 * Purpose: The Stamp logo: the name set in mono inside a tilted rubber-stamp border, linking home.
 * Exports: Wordmark
 * Used by: SiteHeader, SiteFooter
 */
import type { ReactElement } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/** Ink border, not red: stamp red is reserved for the verdict and the primary button. */
export function Wordmark({ className }: { className?: string }): ReactElement {
  return (
    <Link
      to="/"
      aria-label="Stamp, home"
      className={cn(
        'inline-block -rotate-2 rounded-md border-2 border-ink px-2 py-0.5 font-mono text-card-title tracking-tight text-ink',
        className,
      )}
    >
      Stamp
    </Link>
  )
}
