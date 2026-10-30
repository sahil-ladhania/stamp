/**
 * File: describe-check.ts
 * Purpose: Plain terminal lines for a library check: failures grouped by rule with a few claim ids, then the owner's notes.
 * Exports: describeFailures, describeNotes
 * Used by: scripts/library-export.ts, scripts/db-seed.ts
 */
import type { LibraryFinding } from "./check-guide.js";

const SHOWN_IDS = 3;

/** One line per rule: how many claims, and the first few ids, so 22 failing claims read as one line. */
export function describeFailures(
  failures: readonly LibraryFinding[],
): string[] {
  const byRule = new Map<string, LibraryFinding[]>();
  for (const failure of failures) {
    byRule.set(failure.rule, [...(byRule.get(failure.rule) ?? []), failure]);
  }
  return [...byRule].map(([rule, group]) => {
    const ids = group.flatMap((f) => (f.claimId ? [f.claimId] : []));
    if (ids.length === 0) return `  fails ${rule}: ${group[0]?.message ?? ""}`;
    const shown = ids.slice(0, SHOWN_IDS).join(", ");
    const more =
      ids.length > SHOWN_IDS ? `, and ${ids.length - SHOWN_IDS} more` : "";
    return `  fails ${rule}: ${group[0]?.message ?? ""} (${ids.length} claims: ${shown}${more})`;
  });
}

/** The notes never fail a guide; they are what to look at by hand. */
export function describeNotes(notes: readonly string[]): string[] {
  return notes.map((note) => `  note: ${note}`);
}
