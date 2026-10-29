/**
 * File: accordion.tsx
 * Purpose: Accordion primitive (Radix): headers with a button, content that opens and closes by height and opacity in 200 ms.
 *          The item is a plain element, so a row can hold other controls beside its trigger.
 * Exports: Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent
 * Used by: components/guide/StepRow.tsx, components/guide/BlockerCallout.tsx
 */
import type { ComponentProps, ReactElement } from 'react'
import { Accordion as AccordionPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export const Accordion = AccordionPrimitive.Root
export const AccordionItem = AccordionPrimitive.Item
export const AccordionHeader = AccordionPrimitive.Header
export const AccordionTrigger = AccordionPrimitive.Trigger

/** The inner div carries the padding, so the height animation measures the whole content. */
export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>): ReactElement {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden motion-safe:data-[state=closed]:animate-accordion-up motion-safe:data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn(className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
