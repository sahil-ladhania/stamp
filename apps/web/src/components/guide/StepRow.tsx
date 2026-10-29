/**
 * File: StepRow.tsx
 * Purpose: One step as a row of a numbered stepper. The title and a one-line detail sit beside the label of that detail; under them a quiet
 *          line says who does it and the effort ("Human · Effort not stated"), with no label. The full detail and the effort, with the effort's
 *          own label, open on click. Each label sits beside the text it belongs to, so a step never reads as two things at once.
 * Exports: StepRow
 * Used by: components/guide/StepsSection.tsx
 */
import type { ReactElement } from "react";
import { ChevronRight } from "lucide-react";
import { ClaimEvidence } from "@/components/evidence/ClaimEvidence";
import { ClaimLine } from "@/components/evidence/ClaimLine";
import { ActorChip } from "@/components/shared/ActorChip";
import { AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Step } from "@/types/guide-model";
import { clampWords } from "@/utils/clamp-words";
import { describeEffort, type StepEffort } from "@/utils/step-effort";

/** The line is the li's ::before, from under this number to the next row. */
const LINE = "before:absolute before:top-9 before:-bottom-0 before:left-[0.9375rem] before:w-0.5 before:bg-ink-muted/40 last:before:hidden";

function EffortText({ effort }: { effort: StepEffort }): ReactElement {
  if (effort.kind === "unknown") return <span>Effort not stated</span>;
  if (effort.kind === "duration") return <span className="font-mono text-data text-ink">{effort.text}</span>;
  return <span className="text-ink">{effort.text}</span>;
}

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
          <div className="flex items-start gap-3">
            <AccordionHeader className="m-0 min-w-0 flex-1">
              <AccordionTrigger className="group flex w-full cursor-pointer items-start gap-2 text-left">
                <ChevronRight
                  aria-hidden
                  className="mt-1 size-4 shrink-0 text-ink-muted motion-safe:transition-transform group-data-[state=open]:rotate-90"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-card-title text-ink">{step.title}</span>
                  <span className="line-clamp-2 text-body text-ink-muted group-data-[state=open]:hidden">
                    {clampWords(step.detail.text, 90)}
                  </span>
                </span>
              </AccordionTrigger>
            </AccordionHeader>
            <ClaimEvidence claim={step.detail} className="shrink-0" />
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-small text-ink-muted">
            <ActorChip actor={step.actor} />
            <span aria-hidden>·</span>
            <EffortText effort={describeEffort(step.effort)} />
          </p>
          <AccordionContent className="pl-6">
            <div className="flex flex-col gap-3">
              <p className="max-w-prose text-body text-ink">{step.detail.text}</p>
              <div className="flex flex-col gap-1">
                <p className="text-small text-ink-muted">Effort</p>
                <ClaimLine claim={step.effort} unknownText="Effort not stated" />
              </div>
            </div>
          </AccordionContent>
        </div>
      </li>
    </AccordionItem>
  );
}
