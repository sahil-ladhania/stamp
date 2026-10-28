/**
 * File: StepRow.tsx
 * Purpose: One step as a row of a numbered stepper: the number on the line, the title and a one-line detail, then the actor, the
 *          effort and the label of the detail. The full detail opens on click. The effort is a claim too: its chip carries its own label.
 * Exports: StepRow
 * Used by: components/guide/StepsSection.tsx
 */
import type { ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { ClaimEvidence } from "@/components/evidence/ClaimEvidence";
import { ActorChip } from "@/components/shared/ActorChip";
import { UnknownValue } from "@/components/shared/UnknownValue";
import { AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Claim, Step } from "@/types/guide-model";
import { clampWords } from "@/utils/clamp-words";
import { extractDuration } from "@/utils/extract-duration";
import { isUnknownClaim } from "@/utils/is-unknown-claim";

function EffortChip({ claim }: { claim: Claim }): ReactElement {
  if (isUnknownClaim(claim)) return <UnknownValue text="No effort stated" claim={claim} className="text-small" />;
  const duration = extractDuration(claim.text);
  return (
    <ClaimEvidence variant="chip" claim={claim} isMono={duration !== null}>
      {duration ?? clampWords(claim.text, 40)}
    </ClaimEvidence>
  );
}

/** The line is the li's ::before, from under this number to the next row. */
const LINE = "before:absolute before:top-9 before:-bottom-0 before:left-[0.9375rem] before:w-0.5 before:bg-ink-muted/40 last:before:hidden";

export function StepRow({ step, number }: { step: Step; number: number }): ReactElement {
  return (
    <AccordionItem value={step.id} asChild>
      <li className={`relative grid grid-cols-[2rem_1fr] gap-x-3 pb-6 last:pb-0 ${LINE}`}>
        <span
          aria-hidden
          className="relative z-10 flex size-8 items-center justify-center rounded-full border-2 border-ink bg-paper font-mono text-data text-ink"
        >
          {number}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <AccordionHeader className="m-0">
            <AccordionTrigger className="group flex w-full cursor-pointer items-start gap-2 text-left">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-card-title text-ink">{step.title}</span>
                <span className="line-clamp-1 text-body text-ink-muted group-data-[state=open]:hidden">{step.detail.text}</span>
              </span>
              <ChevronDown
                aria-hidden
                className="mt-1 size-4 shrink-0 text-ink-muted motion-safe:transition-transform group-data-[state=open]:rotate-180"
              />
            </AccordionTrigger>
          </AccordionHeader>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <ActorChip actor={step.actor} />
            <EffortChip claim={step.effort} />
            <ClaimEvidence claim={step.detail} />
          </div>
          <AccordionContent>
            <p className="max-w-prose text-body text-ink">{step.detail.text}</p>
          </AccordionContent>
        </div>
      </li>
    </AccordionItem>
  );
}
