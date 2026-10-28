/**
 * File: JumpToSelect.tsx
 * Purpose: A compact native "Jump to" select for the small-screen form of the section navigation. Native, so the phone's own
 *          picker is used.
 * Exports: JumpToSelect
 * Used by: components/nav/SectionNav.tsx
 */
import type { ChangeEvent, ReactElement } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { NavItem } from "./nav-item";

type JumpToSelectProps = { items: readonly NavItem[]; activeId: string | null };

export function JumpToSelect({ items, activeId }: JumpToSelectProps): ReactElement {
  const isReduced = useReducedMotion();

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    document.getElementById(event.target.value)?.scrollIntoView({ behavior: isReduced ? "auto" : "smooth" });
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="jump-to" className="text-small text-ink-muted">
        Jump to
      </label>
      <select
        id="jump-to"
        value={activeId ?? undefined}
        onChange={handleChange}
        className="h-9 min-w-0 flex-1 rounded-md border border-rule bg-card px-3 text-small text-ink hover:border-ink-muted"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
            {item.isUncertain ? " (mostly Uncertain)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
