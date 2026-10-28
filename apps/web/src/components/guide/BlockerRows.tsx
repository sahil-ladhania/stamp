/**
 * File: BlockerRows.tsx
 * Purpose: The detail rows of an open blocker: the cause, the fix (set apart, since it is the action) and the contact as a small
 *          line. Each claim has its label. A missing contact reads "Not found".
 * Exports: BlockerRows
 * Used by: components/guide/BlockerCallout.tsx
 */
import type { ReactElement } from "react";
import { ClaimLine } from "@/components/evidence/ClaimLine";
import { UnknownValue } from "@/components/shared/UnknownValue";
import type { Blocker } from "@/types/guide-model";

export function BlockerRows({ blocker }: { blocker: Blocker }): ReactElement {
  return (
    <dl className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <dt className="text-small text-ink-muted">Cause</dt>
        <dd>
          <ClaimLine claim={blocker.cause} />
        </dd>
      </div>
      <div className="flex flex-col gap-1 rounded-md border border-rule bg-paper p-3">
        <dt className="text-small font-semibold text-ink">Fix</dt>
        <dd>
          <ClaimLine claim={blocker.fix} />
        </dd>
      </div>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <dt className="text-small text-ink-muted">Contact</dt>
        <dd className="min-w-0 flex-1">
          {blocker.contact ? <ClaimLine claim={blocker.contact} /> : <UnknownValue hasBadge={false} className="text-small" />}
        </dd>
      </div>
    </dl>
  );
}
