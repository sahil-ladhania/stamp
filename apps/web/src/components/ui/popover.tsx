/**
 * File: popover.tsx
 * Purpose: Popover primitive (Radix): a panel that opens from a trigger, closes on Escape and returns focus to the trigger.
 *          Ink border instead of a shadow, since the design system has no shadows.
 * Exports: Popover, PopoverTrigger, PopoverContent
 * Used by: components/evidence/ClaimEvidence.tsx, components/verdict/DifficultyPopover.tsx, components/app-home/DifficultyColumnHelp.tsx
 */
import type { ComponentProps, ReactElement } from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

/** Fades and scales in over 150 ms. `motion-safe` keeps it still for visitors who ask for reduced motion. */
export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 8,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>): ReactElement {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={16}
        className={cn(
          'z-50 max-h-[min(30rem,var(--radix-popover-content-available-height))] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto rounded-md border border-ink bg-card p-4 text-ink outline-none',
          'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95',
          'motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:zoom-out-95 motion-safe:duration-150',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
