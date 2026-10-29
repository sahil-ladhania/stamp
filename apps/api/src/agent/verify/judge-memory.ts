/**
 * File: judge-memory.ts
 * Purpose: Keeps the support check's verdicts between verify passes: an unchanged claim and quote is not asked about again, so a retry cannot overturn an earlier answer just because the batch around it changed.
 * Exports: judgeWithMemory, itemKey, JudgeMemory
 * Used by: agent/nodes/verify.ts
 */
import type { JudgeItem } from "../prompts/support-judge.js";
import { runJudge, type JudgeOptions, type Verdict } from "./support-judge.js";

/** Verdicts by item key; a key holds the claim's slot, its text and its quote. */
export type JudgeMemory = Record<string, Verdict>;

const SUPPORTED: Verdict = { support: "supported", aboutProduct: "yes" };

export const itemKey = (item: JudgeItem): string =>
  `${item.id}\u0001${item.claim}\u0001${item.quote}`;

/**
 * A verdict for every item, by id: remembered ones are reused, the rest are asked in one call (an item the
 * model leaves out is supported). Returns null, with nothing remembered, if that call cannot be made.
 */
export async function judgeWithMemory(
  app: { appName: string; product: string | null },
  items: readonly JudgeItem[],
  options: JudgeOptions,
  memory: JudgeMemory,
): Promise<{ verdicts: Map<string, Verdict>; memory: JudgeMemory } | null> {
  const fresh = items.filter((item) => memory[itemKey(item)] === undefined);
  const answered =
    fresh.length === 0 ? new Map() : await runJudge(app, fresh, options);
  if (answered === null) {
    return null;
  }
  const next: JudgeMemory = { ...memory };
  for (const item of fresh) {
    next[itemKey(item)] = answered.get(item.id) ?? SUPPORTED;
  }
  const verdicts = new Map(
    items.map((item) => [item.id, next[itemKey(item)] ?? SUPPORTED] as const),
  );
  return { verdicts, memory: next };
}
