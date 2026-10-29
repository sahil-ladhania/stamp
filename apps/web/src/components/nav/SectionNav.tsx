/**
 * File: SectionNav.tsx
 * Purpose: The map of a long page. A sticky rail on a wide screen, a sticky "Jump to" select on a small one. It highlights the
 *          section in view and marks a section that is mostly Uncertain. Render it as a direct child of the page grid: the
 *          rail is the first column, and the select spans the top.
 * Exports: SectionNav
 * Used by: pages/GuidePage.tsx (via GuideView), pages/HowWeVerifyPage.tsx
 */
import type { ReactElement } from "react";
import { CircleHelp } from "lucide-react";
import { Link } from "react-router";
import { useActiveSection } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";
import { JumpToSelect } from "./JumpToSelect";
import type { NavItem } from "./nav-item";

type SectionNavProps = { items: readonly NavItem[]; label?: string };

export function SectionNav({ items, label = "On this page" }: SectionNavProps): ReactElement {
  const activeId = useActiveSection(items.map((item) => item.id));

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 border-b border-rule bg-paper px-4 py-2 tablet:-mx-6 tablet:px-6 desktop:hidden">
        <JumpToSelect items={items} activeId={activeId} />
      </div>
      <aside className="hidden desktop:block">
        <nav aria-label={label} className="sticky top-6 flex flex-col gap-3 py-10">
          <p className="text-small font-semibold text-ink">{label}</p>
          <ul className="flex flex-col">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id}>
                  <Link
                    to={`#${item.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-2 border-l-2 py-1.5 pl-3 text-small motion-safe:transition-colors",
                      isActive ? "border-ink font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink",
                    )}
                  >
                    <span>{item.label}</span>
                    {item.isUncertain && (
                      <span title="Mostly Uncertain" className="shrink-0">
                        <CircleHelp aria-hidden className="size-3.5 text-uncertain" />
                        <span className="sr-only">Mostly Uncertain</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
