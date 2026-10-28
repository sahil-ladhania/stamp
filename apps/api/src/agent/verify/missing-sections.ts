/**
 * File: missing-sections.ts
 * Purpose: Names the sections that came out with no Sourced claim, which is what triggers the one retry pass.
 * Exports: missingSections, RETRY_WATCHED
 * Used by: agent/nodes/verify.ts
 */
import type { Claim } from "@stamp/schema";

/** The sections a guide cannot do without: the setup steps and the scopes. Others may honestly be empty. */
export const RETRY_WATCHED = ["steps", "scopes"] as const;

/** A watched section is missing when none of its claims (ids like `steps.0.detail`) ended up Sourced or Tested. */
export function missingSections(claims: readonly Claim[]): string[] {
  return RETRY_WATCHED.filter(
    (section) =>
      !claims.some(
        (claim) =>
          claim.label !== "uncertain" && claim.id.split(".")[0] === section,
      ),
  );
}
