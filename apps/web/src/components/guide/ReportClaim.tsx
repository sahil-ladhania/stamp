/**
 * File: ReportClaim.tsx
 * Purpose: The "Report wrong claim" control on one claim: a button, then a short form with an optional note, then a
 *          confirmation. It acts on the guide it sits in and renders nothing outside a guide.
 * Exports: ReportClaim
 * Used by: components/guide/ClaimEvidence.tsx
 */
import { useId, useState, type FormEvent, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGuideSlug } from "@/hooks/useGuideSlug";
import { useReportClaim } from "@/hooks/useReportClaim";
import type { Claim } from "@/types/guide-model";
import { getApiErrorMessage } from "@/utils/error-messages";
import { excerpt } from "@/utils/excerpt";

const MAX_NOTE_LENGTH = 2000; // Same bound as the API (docs/api-design.md).

export function ReportClaim({ claim }: { claim: Claim }): ReactElement | null {
  const slug = useGuideSlug();
  const { report, isPending, error, reset } = useReportClaim();
  const [isOpen, setIsOpen] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [note, setNote] = useState("");
  const noteId = useId();

  if (!slug) return null;

  if (isSent) {
    return (
      <p role="status" className="text-small text-ink-muted">
        Report sent.
      </p>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        // Many claims share this button, so its name carries the start of the claim.
        aria-label={`Report wrong claim: ${excerpt(claim.text)}`}
        onClick={() => setIsOpen(true)}
        className="self-start text-small text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        Report wrong claim
      </button>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const text = note.trim();
    const result = await report(slug ?? "", {
      claimId: claim.id,
      ...(text ? { note: text } : {}),
    });
    if (result) setIsSent(true);
  }

  function cancel(): void {
    reset();
    setIsOpen(false);
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-md border border-rule bg-card p-3"
    >
      <label htmlFor={noteId} className="text-small text-ink">
        What is wrong? (optional)
      </label>
      <Textarea
        id={noteId}
        autoFocus
        rows={3}
        maxLength={MAX_NOTE_LENGTH}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={isPending}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          Send report
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={cancel}>
          Cancel
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-small text-ink">
          {getApiErrorMessage(error)}
        </p>
      )}
    </form>
  );
}
