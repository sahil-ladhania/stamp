/**
 * File: BlockerCallout.tsx
 * Purpose: One blocker as a warning callout: the symptom as the title (two lines at most) with its label, and the cause, fix and
 *          contact when it is open. The top blocker is tagged and open; the others start closed.
 * Exports: BlockerCallout
 * Used by: components/guide/BlockersSection.tsx
 */
import type { ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { ClaimEvidence } from "@/components/evidence/ClaimEvidence";
import { Callout } from "@/components/shared/Callout";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Blocker } from "@/types/guide-model";
import { BlockerRows } from "./BlockerRows";

type BlockerCalloutProps = { blocker: Blocker; isTop: boolean };

/** Render inside a `ul`. The tag uses ink, not a label colour: colour belongs to the labels. */
export function BlockerCallout({ blocker, isTop }: BlockerCalloutProps): ReactElement {
  return (
    <li>
      <Callout variant="warning">
        <Accordion type="single" collapsible defaultValue={isTop ? blocker.id : undefined}>
          <AccordionItem value={blocker.id}>
            <div className="flex items-start gap-3">
              <AccordionHeader className="m-0 min-w-0 flex-1">
                <AccordionTrigger className="group flex w-full cursor-pointer items-start gap-2 text-left">
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    {isTop && (
                      <span className="rounded-sm border border-ink px-1.5 text-[0.6875rem] leading-5 font-semibold tracking-wide text-ink uppercase">
                        Top blocker
                      </span>
                    )}
                    <span className="line-clamp-2 text-card-title text-ink">{blocker.title}</span>
                  </span>
                  <ChevronDown
                    aria-hidden
                    className="mt-1 size-4 shrink-0 text-ink-muted motion-safe:transition-transform group-data-[state=open]:rotate-180"
                  />
                </AccordionTrigger>
              </AccordionHeader>
              <ClaimEvidence claim={blocker.symptom} className="shrink-0" />
            </div>
            <AccordionContent className="pt-3">
              <BlockerRows blocker={blocker} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Callout>
    </li>
  );
}
