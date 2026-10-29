/**
 * File: sheet.tsx
 * Purpose: Bottom sheet primitive (Radix Dialog): the small-screen form of a popover. It traps focus, closes on Escape
 *          and on the overlay, and names itself for screen readers.
 * Exports: Sheet, SheetTrigger, SheetContent
 * Used by: components/evidence/ClaimEvidence.tsx
 */
import type { ComponentProps, ReactElement } from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger

type SheetContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  /** The accessible name. It is read, not shown. */
  title: string
}

export function SheetContent({ className, children, title, ...props }: SheetContentProps): ReactElement {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-ink/40',
          'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0',
          'motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0',
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 max-h-[85svh] overflow-y-auto rounded-t-md border-t border-ink bg-card p-4 pb-8 text-ink outline-none',
          'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-bottom',
          'motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:slide-out-to-bottom motion-safe:duration-200',
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">Evidence for this claim</DialogPrimitive.Description>
        {/* In flow, above the content, so it never covers the first line. */}
        <div className="-mt-1 -mr-1 mb-1 flex justify-end">
          <DialogPrimitive.Close
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
