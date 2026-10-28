/**
 * File: input.tsx
 * Purpose: Token-styled text input primitive.
 * Exports: Input
 * Used by: SearchBar
 */
import type { ComponentProps, ReactElement } from 'react'
import { cn } from '@/lib/utils'

/** Text input with a visible border; an invalid state darkens the border (no red, red is the verdict). */
export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>): ReactElement {
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-rule bg-card px-3 text-body text-ink transition-colors placeholder:text-ink-muted hover:border-ink-muted outline-none focus:outline-none focus-visible:outline-none aria-invalid:border-ink disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
