/**
 * File: ClampedText.tsx
 * Purpose: Text cut on a word boundary with a "More" toggle that shows the rest. Short text is shown whole, with no toggle.
 * Exports: ClampedText
 * Used by: components/guide/GuideHeader.tsx
 */
import { useState, type ReactElement } from "react";
import { clampWords } from "@/utils/clamp-words";

type ClampedTextProps = { text: string; max: number; className?: string };

export function ClampedText({ text, max, className }: ClampedTextProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const clamped = clampWords(text, max);
  const isClamped = clamped !== text.replace(/\s+/g, " ").trim();

  return (
    <p className={className}>
      {isOpen || !isClamped ? text : clamped}
      {isClamped && (
        <>
          {" "}
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            className="text-small font-medium text-ink underline-offset-4 hover:underline focus-visible:underline"
          >
            {isOpen ? "Less" : "More"}
          </button>
        </>
      )}
    </p>
  );
}
