/**
 * File: collect-guide-ids.ts
 * Purpose: Collects every claim, step, scope, blocker and conflict id inside a guide document.
 * Exports: collectGuideIds
 * Used by: services/reports.ts
 */

/** Walks guide JSON and returns each string `id` field, so a report can name any of them. */
export function collectGuideIds(value: unknown): Set<string> {
  const ids = new Set<string>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== "object" || node === null) {
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === "id" && typeof child === "string") {
        ids.add(child);
      } else {
        visit(child);
      }
    }
  };
  visit(value);
  return ids;
}
