/**
 * File: StageGroup.tsx
 * Purpose: One stage of the trace. A stage with events is an accordion row: open while it runs, closed once it is done, and the reader
 *          can open or close it. A stage with no events of its own (a model call, scoring) is a plain header. Verify gets a filter that
 *          shows downgrades only. Render inside an Accordion that is an `ol`.
 * Exports: StageGroup
 * Used by: components/run/TraceTimeline.tsx
 */
import { useState, type ReactElement } from "react";
import { AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { StageGroup as StageGroupData } from "@/utils/run-groups";
import { DowngradeFilter } from "./DowngradeFilter";
import { EventRow } from "./EventRow";
import { StageGroupHeader } from "./StageGroupHeader";

const VERIFY_STAGE = 5;
const ROW = "scroll-mt-28 border-b border-rule last:border-b-0";

export function StageGroup({ group }: { group: StageGroupData }): ReactElement {
  const [onlyDowngrades, setOnlyDowngrades] = useState(false);
  const id = `stage-group-${group.stage}`;

  if (group.items.length === 0) {
    return (
      <li id={id} className={ROW}>
        <StageGroupHeader group={group} isExpandable={false} />
      </li>
    );
  }

  const downgrades = group.items.filter((item) => item.type === "downgraded");
  const rows = onlyDowngrades ? downgrades : group.items;

  return (
    <AccordionItem value={String(group.stage)} asChild>
      <li id={id} className={ROW}>
        <AccordionHeader className="m-0">
          <AccordionTrigger className="group flex w-full cursor-pointer">
            <StageGroupHeader group={group} isExpandable />
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionContent className="flex flex-col gap-3 pb-3 pl-7">
          {group.stage === VERIFY_STAGE && downgrades.length > 0 && (
            <div>
              <DowngradeFilter count={downgrades.length} isOn={onlyDowngrades} onToggle={() => setOnlyDowngrades((on) => !on)} />
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {rows.map((item) => (
              <EventRow key={item.id} item={item} />
            ))}
          </ul>
        </AccordionContent>
      </li>
    </AccordionItem>
  );
}
