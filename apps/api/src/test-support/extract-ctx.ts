/**
 * File: extract-ctx.ts
 * Purpose: A section context with a hand-moved clock for the section runner and extract node tests.
 * Exports: sectionCtx
 * Used by: agent/extract/run-section*.test.ts
 */
import { createRunUsage } from "../lib/usage.js";
import type { SectionContext } from "../agent/extract/section-types.js";
import { PAGES, PAGE_INDEX } from "./extract-fixtures.js";
import { APP } from "./node-fixtures.js";

/** The context, plus the clock: `time.now` moves it, and `window` sets how long the stage's window is. */
export function sectionCtx(
  overrides: Partial<SectionContext> = {},
  window = 40_000,
) {
  const time = { now: 1_000_000 };
  const ctx: SectionContext = {
    runId: "run_1",
    app: APP,
    pages: PAGES,
    index: PAGE_INDEX,
    usage: createRunUsage(),
    now: () => time.now,
    deadline: time.now + window,
    ...overrides,
  };
  return { ctx, time };
}
