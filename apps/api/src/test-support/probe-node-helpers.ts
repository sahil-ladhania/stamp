/**
 * File: probe-node-helpers.ts
 * Purpose: Claims that quote an authorize URL, and shortcuts to read labels and run the probe stage against a mocked network.
 * Exports: AUTH, quoting, claims, labels, probe
 * Used by: agent/nodes/probe*.test.ts
 */
import type { Claim } from "@stamp/schema";
import { probeNode } from "../agent/nodes/probe.js";
import { createHarness } from "./graph-harness.js";
import { readyState } from "./save-helpers.js";

export const AUTH = "https://acme.com/oauth/authorize";
export const quoting = (
  id: string,
  quote: string,
  over: Partial<Claim> = {},
): Claim => ({
  id,
  text: `Fact ${id}.`,
  label: "sourced",
  sources: [{ url: "https://docs.acme.com/oauth", quote, tier: "official" }],
  ...over,
});
export const claims = [
  quoting("steps.0.detail", `Send users to ${AUTH}.`),
  quoting("limits.0", "Each app is capped at 25 installs."),
  quoting("requirements.0", `The endpoint ${AUTH} needs a client ID.`),
  quoting("scopes.0.reason", `Also ${AUTH}`, { label: "uncertain" }),
];
export const labels = (update: { claims?: unknown }) =>
  Object.fromEntries(
    ((update.claims ?? []) as Claim[]).map((c) => [c.id, c.label]),
  );

export async function probe(
  over: Parameters<typeof readyState>[0] = {},
  harness = createHarness(),
) {
  const update = await probeNode(
    readyState({ claims, ...over }),
    harness.config,
  );
  return { h: harness, update };
}
