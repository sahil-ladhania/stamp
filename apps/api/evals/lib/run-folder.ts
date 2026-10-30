/**
 * File: run-folder.ts
 * Purpose: The name of a run folder from the clock: 2026-10-29T10-00-00Z.
 * Exports: runFolder
 * Used by: evals/cli.ts, evals/resolve/cli.ts
 */
export function runFolder(now: Date): string {
  return `${now.toISOString().slice(0, 19).replace(/:/g, "-")}Z`;
}
