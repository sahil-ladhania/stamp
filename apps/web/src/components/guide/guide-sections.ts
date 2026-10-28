/**
 * File: guide-sections.ts
 * Purpose: The entries of the guide's section navigation, in page order. A section that is mostly Uncertain is marked. The
 *          conflicts section is listed only when the page shows it.
 * Exports: getGuideNavItems
 * Used by: components/guide/GuideView.tsx
 */
import type { NavItem } from "@/components/nav/nav-item";
import type { Guide } from "@/types/guide-model";
import { sectionUncertainty } from "@/utils/section-uncertainty";
import { GUIDE_SECTION } from "@/utils/uncertain-sections";

export function getGuideNavItems(guide: Guide): NavItem[] {
  const uncertain = sectionUncertainty(guide);
  const hasConflicts = guide.conflicts.length > 0 || guide.uncertainSections.includes(GUIDE_SECTION.conflicts);
  return [
    { id: "verdict", label: "Verdict" },
    { id: "timeline", label: "Timeline", isUncertain: uncertain.timeline },
    { id: "steps", label: "Steps", isUncertain: uncertain.steps },
    { id: "requirements", label: "Requirements", isUncertain: uncertain.requirements },
    { id: "blockers", label: "Blockers", isUncertain: uncertain.blockers },
    ...(hasConflicts ? [{ id: "conflicts", label: "Source conflicts" }] : []),
    { id: "sources", label: "Sources" },
  ];
}
