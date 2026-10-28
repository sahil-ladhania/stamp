/**
 * File: DifficultyPopover.tsx
 * Purpose: "Why this score": the difficulty factors, their points and the rule's words for them, in a popover (a bottom sheet
 *          on a phone). The score is a fixed rule, so there is no evidence label here, only the rule.
 * Exports: DifficultyPopover
 * Used by: components/verdict/DifficultyRow.tsx
 */
import type { ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { TextLink } from "@/components/shared/TextLink";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Difficulty } from "@/types/guide-model";

const PHONE = "(max-width: 47.9375rem)";
const TRIGGER_CLASS =
  "inline-flex cursor-pointer items-center gap-1 text-small font-medium text-ink underline-offset-4 hover:underline";

function Breakdown({ difficulty }: { difficulty: Difficulty }): ReactElement {
  return (
    <div className="flex flex-col gap-3 text-left">
      <ul className="flex flex-col divide-y divide-rule">
        {difficulty.factors.map((factor) => (
          <li key={factor.name} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 py-2">
            <span className="text-body font-semibold text-ink">{factor.name}</span>
            <span className="font-mono text-data text-ink">
              {factor.points}/{factor.max}
            </span>
            <span className="col-span-2 text-small text-ink-muted">{factor.reason}</span>
          </li>
        ))}
      </ul>
      <p className="text-body text-ink">{`${difficulty.total} points, so the score is ${difficulty.score} of 5.`}</p>
      <TextLink to="/how-we-verify#difficulty">Read how difficulty is scored</TextLink>
    </div>
  );
}

export function DifficultyPopover({ difficulty }: { difficulty: Difficulty }): ReactElement {
  const isPhone = useMediaQuery(PHONE);
  const trigger = (
    <button type="button" className={TRIGGER_CLASS}>
      Why this score
      <ChevronDown aria-hidden className="size-4" />
    </button>
  );

  if (isPhone) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent title="Why this score">
          <Breakdown difficulty={difficulty} />
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent>
        <Breakdown difficulty={difficulty} />
      </PopoverContent>
    </Popover>
  );
}
