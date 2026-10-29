/**
 * File: top-blocker.ts
 * Purpose: Picks the guide's top blocker in code: approval before setup before limit, never an error message, a Sourced official blocker before the rest. The model no longer points at one.
 * Exports: blockerKind, pickTopBlockerId, BlockerKind
 * Used by: agent/guide/assemble.ts
 */
import type { Blocker } from "@stamp/schema";

export type BlockerKind = "approval" | "setup" | "limit" | "error";

const APPROVAL =
  /review|approv|verif|audit|assess|certif|listing|vett|reject|compliance|security|marketplace/i;
const ERROR =
  /invalid_\w+|\berror\b|exception|unauthori[sz]ed|forbidden|\b[45]\d\d\b|fails? with|failed/i;
const SETUP =
  /redirect|callback|client[ _]?(?:id|secret)|consent|domain|\bplan\b|\btier\b|subscription|account type|workspace|register|configur|enterprise|credential|sandbox|developer account/i;
const LIMIT = /limit|quota|\bcap\b|throttl|rate/i;

/** Higher is more important to a developer deciding whether to start; an error message is never a top blocker. */
const RANK: Record<Exclude<BlockerKind, "error">, number> = {
  approval: 3,
  setup: 2,
  limit: 1,
};

/**
 * What kind of problem a blocker is, from its words. The symptom decides an error first (a message a coder
 * sees, whatever its cause says); approval beats setup beats limit; null when the words fit none.
 */
export function blockerKind(blocker: Blocker): BlockerKind | null {
  const symptom = blocker.symptom.text;
  const all = `${symptom} ${blocker.cause.text} ${blocker.fix.text}`;
  if (APPROVAL.test(symptom) || APPROVAL.test(blocker.cause.text))
    return "approval";
  if (ERROR.test(symptom)) return "error";
  if (SETUP.test(all)) return "setup";
  if (LIMIT.test(all)) return "limit";
  return null;
}

/** A Sourced or Tested claim on an official page counts for more than an Uncertain one or a third party's. */
const evidenceScore = (blocker: Blocker): number => {
  const source = blocker.symptom.sources[0];
  return (
    (blocker.symptom.label === "uncertain" ? 0 : 2) +
    (source?.tier === "official" ? 1 : 0)
  );
};

/** The top blocker's id, or null when no blocker is an approval, setup or limit problem. Ties keep the earlier blocker. */
export function pickTopBlockerId(blockers: readonly Blocker[]): string | null {
  let best: { id: string; rank: number; evidence: number } | null = null;
  for (const blocker of blockers) {
    const kind = blockerKind(blocker);
    if (kind === null || kind === "error") continue;
    const candidate = {
      id: blocker.id,
      rank: RANK[kind],
      evidence: evidenceScore(blocker),
    };
    if (
      best === null ||
      candidate.rank > best.rank ||
      (candidate.rank === best.rank && candidate.evidence > best.evidence)
    ) {
      best = candidate;
    }
  }
  return best?.id ?? null;
}
