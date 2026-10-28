/**
 * File: BlockerDetails.tsx
 * Purpose: The labelled fields of a blocker (symptom, cause, fix, contact), each with its own evidence.
 *          A missing contact reads Unknown.
 * Exports: BlockerDetails
 * Used by: components/guide/TopBlockerCard.tsx, components/guide/BlockerCard.tsx
 */
import type { ReactElement } from "react";
import type { Blocker } from "@/types/guide-model";
import { ClaimEvidence } from "./ClaimEvidence";

type BlockerField = "symptom" | "cause" | "fix" | "contact";

const LABEL: Record<BlockerField, string> = {
  symptom: "Symptom",
  cause: "Cause",
  fix: "Fix",
  contact: "Contact",
};

const ALL_FIELDS: readonly BlockerField[] = [
  "symptom",
  "cause",
  "fix",
  "contact",
];

type BlockerDetailsLayout = "columns" | "stack";

export function BlockerDetails({
  blocker,
  fields = ALL_FIELDS,
  layout = "columns",
}: {
  blocker: Blocker;
  fields?: readonly BlockerField[];
  /** Stack labels above values in narrow cards; columns for full-width blocker lists. */
  layout?: BlockerDetailsLayout;
}): ReactElement {
  return (
    <dl className="flex flex-col gap-3">
      {fields.map((field) => {
        const claim = blocker[field];
        const rowClass =
          layout === "stack"
            ? "flex flex-col gap-1"
            : "grid gap-1 tablet:grid-cols-[6rem_1fr] tablet:gap-3";

        return (
          <div key={field} className={rowClass}>
            <dt className="text-small text-ink-muted">{LABEL[field]}</dt>
            <dd className="flex min-w-0 flex-col gap-2">
              <span className="text-body text-ink">
                {claim?.text ?? "Unknown"}
              </span>
              {claim && <ClaimEvidence claim={claim} />}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
