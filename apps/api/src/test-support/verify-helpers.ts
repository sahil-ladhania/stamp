/**
 * File: verify-helpers.ts
 * Purpose: Runs the verify node on the saved pages with the standard drafts, for the verify node tests.
 * Exports: verify
 * Used by: agent/nodes/verify.test.ts, agent/nodes/verify-gate-retry.test.ts
 */
import type { Claim } from "@stamp/schema";
import { PAGES } from "./extract-fixtures.js";
import { state } from "./extract-node-helpers.js";
import { createHarness } from "./graph-harness.js";
import { DRAFTS } from "./guide-fixtures.js";
import { verifyNode } from "../agent/nodes/verify.js";

/** One verify run: the update it returned, its claims and the harness that recorded the events. */
export async function verify(over: Parameters<typeof state>[1] = {}) {
  const h = createHarness();
  const update = await verifyNode(
    state(PAGES, { drafts: DRAFTS, ...over }),
    h.config,
  );
  return { h, update, claims: (update.claims ?? []) as Claim[] };
}
