/**
 * File: textarea.tsx
 * Purpose: Token-styled multi-line input primitive, matching the text input.
 * Exports: Textarea
 * Used by: components/guide/ReportClaim.tsx
 */
import type { ComponentProps, ReactElement } from 'react'
import { cn } from '@/lib/utils'

/** Same field border as Input; no focus outline on inputs (docs/design-system.md). */
export function Textarea({ className, ...props }: ComponentProps<'textarea'>): ReactElement {
  return (
    <textarea
      className={cn(
        'min-h-20 w-full min-w-0 resize-y rounded-md border border-rule bg-card px-3 py-2 text-body text-ink transition-colors placeholder:text-ink-muted hover:border-ink-muted outline-none focus:outline-none focus-visible:outline-none aria-invalid:border-ink disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
