/**
 * File: tooltip.tsx
 * Purpose: Tooltip primitive that opens on hover and on keyboard focus.
 * Exports: Tooltip, TooltipProvider
 * Used by: EvidenceLabel, App.tsx (provider)
 */
import type { ReactElement, ReactNode } from 'react'
import { Tooltip as TooltipPrimitive } from 'radix-ui'

export const TooltipProvider = TooltipPrimitive.Provider

type TooltipProps = {
  content: ReactNode
  /** One focusable element, so the tooltip also opens from the keyboard. */
  children: ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}

/** Wraps a focusable trigger with an ink-on-paper tooltip. */
export function Tooltip({ content, children, side = 'top' }: TooltipProps): ReactElement {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={16}
          className="z-50 max-w-xs rounded-md bg-ink px-3 py-2 text-small text-paper data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
