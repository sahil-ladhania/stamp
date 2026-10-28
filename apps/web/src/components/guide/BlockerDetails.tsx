/**
 * File: BlockerDetails.tsx
 * Purpose: The labelled fields of a blocker (symptom, cause, fix, contact). A missing value reads Unknown.
 * Exports: BlockerDetails
 * Used by: components/guide/TopBlockerCard.tsx, components/guide/BlockerCard.tsx
 */
import type { ReactElement } from "react";
import type { Blocker } from "@/mocks/types";

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

export function BlockerDetails({
  blocker,
  fields = ALL_FIELDS,
}: {
  blocker: Blocker;
  fields?: readonly BlockerField[];
}): ReactElement {
  return (
    <dl className="flex flex-col gap-2">
      {fields.map((field) => (
        <div
          key={field}
          className="grid gap-1 tablet:grid-cols-[6rem_1fr] tablet:gap-3"
        >
          <dt className="text-small text-ink-muted">{LABEL[field]}</dt>
          <dd className="text-body text-ink">{blocker[field] ?? "Unknown"}</dd>
        </div>
      ))}
    </dl>
  );
}
