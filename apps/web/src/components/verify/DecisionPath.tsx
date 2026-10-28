/**
 * File: DecisionPath.tsx
 * Purpose: The three questions that give a claim its label, as a numbered path with every outcome shown.
 * Exports: DecisionPath
 * Used by: components/verify/LabelsSection.tsx
 */
import type { ReactElement } from "react";
import { EvidenceLabel } from "@/components/shared/EvidenceLabel";
import type { EvidenceKind } from "@/types/guide-model";

type Outcome = {
  answer: "Yes" | "No";
  /** Absent means the claim moves on to the next question. */
  kind?: EvidenceKind;
  note?: string;
};

type Step = { question: string; outcomes: readonly Outcome[] };

// Order and wording from docs/agent-architecture.md section 5.
const STEPS: readonly Step[] = [
  {
    question: "Does the quote appear in the page we fetched?",
    outcomes: [
      { answer: "No", kind: "uncertain", note: "Quote not found in source" },
      { answer: "Yes" },
    ],
  },
  {
    question: "Do the sources disagree?",
    outcomes: [
      { answer: "Yes", kind: "uncertain", note: "Sources disagree" },
      { answer: "No" },
    ],
  },
  {
    question: "Did an endpoint probe or a setup attempt confirm it?",
    outcomes: [
      { answer: "Yes", kind: "tested" },
      { answer: "No", kind: "sourced" },
    ],
  },
];

export function DecisionPath(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-card-title text-ink">How a claim gets its label</h3>
      <ol className="ml-3 flex flex-col">
        {STEPS.map((step, index) => (
          <li
            key={step.question}
            className="relative flex flex-col gap-3 border-l-2 border-ink pb-8 pl-6 last:border-transparent last:pb-0"
          >
            <span
              aria-hidden
              className="absolute top-0 -left-[13px] flex size-6 items-center justify-center rounded-full border-2 border-ink bg-paper text-data text-ink"
            >
              {index + 1}
            </span>
            <p className="text-card-title text-ink">{step.question}</p>
            <ul className="flex flex-col gap-2">
              {step.outcomes.map((outcome) => (
                <li
                  key={outcome.answer}
                  className="grid grid-cols-[2.5rem_1fr] items-center gap-3"
                >
                  <span className="text-data text-ink-muted">
                    {outcome.answer}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {outcome.kind ? (
                      <EvidenceLabel kind={outcome.kind} />
                    ) : (
                      <span className="text-small text-ink-muted">
                        Next question
                      </span>
                    )}
                    {outcome.note && (
                      <span className="text-small text-ink-muted">
                        {outcome.note}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="text-small text-ink-muted">
        Time estimates stay Uncertain until tested.
      </p>
    </div>
  );
}
