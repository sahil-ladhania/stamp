/**
 * File: script-io.ts
 * Purpose: Shared terminal helpers for the hand-run scripts: one-line output, safe error text and the real-mode settings check.
 * Exports: say, describe, checkSettings
 * Used by: scripts/smoke-live.ts, scripts/capture-fixtures.ts
 */
import { z } from "zod";
import { getConfig, requireRealAgentConfig } from "../src/config.js";
import { ModelCallError } from "../src/lib/openai-client.js";

export function say(line: string): void {
  process.stdout.write(`${line}\n`);
}

/** Error text for the terminal; a 400 also shows OpenAI's reason, because that is how a schema rejection reads. */
export function describe(err: unknown): string {
  if (err instanceof ModelCallError && err.status === 400) {
    const reason = err.cause instanceof Error ? err.cause.message : "unknown";
    return `${err.message}: ${reason}`;
  }
  return err instanceof Error ? `${err.name}: ${err.message}` : "unknown error";
}

/** Names the missing settings (never their values); returns false when any are absent. */
export function checkSettings(): boolean {
  try {
    requireRealAgentConfig(getConfig());
    return true;
  } catch (err) {
    const detail =
      err instanceof z.ZodError
        ? `invalid settings in apps/api/.env: ${err.issues.map((issue) => issue.path.join(".")).join(", ")}`
        : err instanceof Error
          ? `${err.message} (set them in apps/api/.env)`
          : "unknown error";
    say(`Cannot run: ${detail}`);
    return false;
  }
}
