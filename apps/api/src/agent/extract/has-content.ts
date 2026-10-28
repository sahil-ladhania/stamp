/**
 * File: has-content.ts
 * Purpose: Says whether a cleaned section output has anything usable left, so an empty draft becomes "unknown".
 * Exports: hasContent
 * Used by: agent/extract/run-section.ts
 */
import type { SectionId, SectionOutput } from "./sections.js";

/** False when nothing usable is left, so the section is unknown rather than an empty draft. */
export function hasContent(
  section: SectionId,
  output: SectionOutput<SectionId>,
): boolean {
  switch (section) {
    case "steps":
      return (output as SectionOutput<"steps">).steps.length > 0;
    case "scopes":
      return (output as SectionOutput<"scopes">).scopes.length > 0;
    case "requirements":
      return (output as SectionOutput<"requirements">).requirements.length > 0;
    case "limits":
      return (output as SectionOutput<"limits">).limits.length > 0;
    case "blockers":
      return (output as SectionOutput<"blockers">).blockers.length > 0;
    case "conflicts":
      return (output as SectionOutput<"conflicts">).conflicts.length > 0;
    case "milestones": {
      const m = output as SectionOutput<"milestones">;
      return [
        m.firstTestEffort,
        m.firstTestWait,
        m.productionEffort,
        m.productionWait,
      ].some((c) => c !== null);
    }
    case "verdict":
      return (output as SectionOutput<"verdict">).summary !== null;
    case "gates": {
      const g = output as SectionOutput<"gates">;
      return (
        g.authMethod !== "unknown" ||
        g.reviewGate !== "unknown" ||
        g.approvalWait !== "unknown" ||
        g.prerequisites.length > 0 ||
        g.hiddenLimits.length > 0 ||
        g.enterprisePlanEvidence !== null
      );
    }
  }
}
