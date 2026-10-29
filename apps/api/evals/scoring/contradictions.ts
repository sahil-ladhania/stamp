/**
 * File: contradictions.ts
 * Purpose: Finds Sourced or Tested facts that contradict the golden set: a wrong gate or wait, a fake scope, or a wrong-product citation.
 * Exports: findContradictions, Contradiction, ContradictionInput
 * Used by: evals/scoring/score-app.ts
 */
import type { EvidenceLabel } from "@stamp/schema";
import type { Verdict } from "./gate.js";
import type { ScopeClass } from "./scopes.js";

export type Contradiction = {
  field: "reviewGate" | "approvalWait" | "scopes" | "source";
  detail: string;
};

export type ContradictionInput = {
  /** A gate or wait that survived verify has a quote found on a page, so it counts as Sourced. */
  gate: { found: string; verdict: Verdict };
  wait: { found: string; verdict: Verdict };
  scopes: { name: string; kind: ScopeClass; label: EvidenceLabel }[];
  claims: { label: EvidenceLabel; wrongProductUrls: string[] }[];
};

/** A contradiction is a confident wrong answer: an Uncertain claim or an unknown fact is never one. */
export function findContradictions(input: ContradictionInput): Contradiction[] {
  const found: Contradiction[] = [];
  if (input.gate.verdict === "wrong") {
    found.push({
      field: "reviewGate",
      detail: `found ${input.gate.found}, which the golden set does not accept`,
    });
  }
  if (input.wait.verdict === "wrong") {
    found.push({
      field: "approvalWait",
      detail: `found ${input.wait.found}, outside the golden range`,
    });
  }
  for (const scope of input.scopes) {
    if (scope.kind === "fake" && scope.label !== "uncertain") {
      found.push({
        field: "scopes",
        detail: `${scope.name} is not a real scope and its claim is ${scope.label}`,
      });
    }
  }
  for (const claim of input.claims) {
    if (claim.label === "uncertain") continue;
    for (const url of claim.wrongProductUrls) {
      found.push({
        field: "source",
        detail: `${claim.label} claim cites a wrong-product page: ${url}`,
      });
    }
  }
  return found;
}
