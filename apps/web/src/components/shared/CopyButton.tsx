/**
 * File: CopyButton.tsx
 * Purpose: A small icon button that copies a value and confirms with a check for a moment, announced to screen readers.
 * Exports: CopyButton
 * Used by: components/guide/ScopesTable.tsx, components/landing/StepVisualShare.tsx
 */
import type { ReactElement } from "react";
import { Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  value: string;
  /** The accessible name, for example "Copy scope crm.objects.contacts.read". */
  label: string;
  className?: string;
};

export function CopyButton({ value, label, className }: CopyButtonProps): ReactElement {
  const { isCopied, copy } = useCopyToClipboard();

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => void copy(value)}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent text-ink-muted transition-colors hover:border-rule hover:text-ink",
          className,
        )}
      >
        {isCopied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      </button>
      <span role="status" className="sr-only">
        {isCopied ? "Copied" : ""}
      </span>
    </>
  );
}
