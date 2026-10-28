/**
 * File: DifficultyColumnHelp.tsx
 * Purpose: The info button in the Difficulty column header: a popover with how the score is set, and the link to the full rule.
 *          The words come from docs/solution.md section 6.
 * Exports: DifficultyColumnHelp
 * Used by: components/app-home/LibraryTable.tsx
 */
import type { ReactElement } from "react";
import { Info } from "lucide-react";
import { TextLink } from "@/components/shared/TextLink";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DifficultyColumnHelp(): ReactElement {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="How difficulty is scored"
          className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:text-ink"
        >
          <Info aria-hidden className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-3 text-left">
        <p className="text-body font-semibold text-ink">How difficulty is scored</p>
        <p className="text-body text-ink-muted">
          A score from 1 to 5 from a fixed rule, not from the AI model. It adds up points for the review gate, the approval wait,
          prerequisites and hidden limits. Same inputs, same score.
        </p>
        <TextLink to="/how-we-verify#difficulty">Read the full rule</TextLink>
      </PopoverContent>
    </Popover>
  );
}
