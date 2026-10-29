/**
 * File: label-counts.ts
 * Purpose: Counts claims by evidence label anywhere inside a guide or a list of claims, for the per-run log line.
 * Exports: countLabels, collectClaims, LabelCounts
 * Used by: agent/run-summary.ts, evals/scoring/*
 */
export type LabelCounts = {
  claims: number;
  sourced: number;
  tested: number;
  uncertain: number;
};

const LABELS = new Set(["sourced", "tested", "uncertain"]);

/** A claim is an object with a label and a list of sources; the walk does not look inside it. */
function isClaim(node: object): node is { label: string; sources: unknown[] } {
  const { label, sources } = node as { label?: unknown; sources?: unknown };
  return (
    typeof label === "string" && LABELS.has(label) && Array.isArray(sources)
  );
}

type FoundClaim = { label: string; sources: unknown[] };

/** Every claim anywhere in the value, in document order. Works on a Guide or on a plain claim list. */
export function collectClaims(value: unknown): FoundClaim[] {
  const found: FoundClaim[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (typeof node === "object" && node !== null) {
      if (isClaim(node)) {
        found.push(node);
      } else {
        Object.values(node).forEach(visit);
      }
    }
  };
  visit(value);
  return found;
}

/** Every claim in the value, by label. Works on a Guide, which holds claims in many places, or on a plain claim list. */
export function countLabels(value: unknown): LabelCounts {
  const counts: LabelCounts = {
    claims: 0,
    sourced: 0,
    tested: 0,
    uncertain: 0,
  };
  for (const claim of collectClaims(value)) {
    counts.claims += 1;
    counts[claim.label as "sourced" | "tested" | "uncertain"] += 1;
  }
  return counts;
}
