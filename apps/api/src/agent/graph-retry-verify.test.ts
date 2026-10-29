/**
 * File: graph-retry-verify.test.ts
 * Purpose: Tests the retry edge driven by the real verify stage: a section with no matched quote, or an unknown review gate, sends the run back to search once, and no more.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger.js";
import { OAUTH_URL, PAGES, claim } from "../test-support/extract-fixtures.js";
import { GATES_OUTPUT } from "../test-support/extract-replies.js";
import { createHarness, recorded } from "../test-support/graph-harness.js";
import { DRAFTS, drafted, withDrafts } from "../test-support/guide-fixtures.js";
import { APP } from "../test-support/node-fixtures.js";
import { verifyNode } from "./nodes/verify.js";
import { stageNode } from "./stage-node.js";

vi.spyOn(logger, "info").mockImplementation(() => {});

const badSteps = drafted<"steps">({
  steps: [
    {
      title: "Create the app",
      detail: claim(OAUTH_URL, "A step the page never mentions."),
      actor: "human",
      effort: null,
    },
  ],
});

/** Extract stand-in: the first pass drafts `first` steps, a retry pass drafts `second`. */
function rig(first: typeof DRAFTS, second: typeof DRAFTS) {
  const search = recorded("search");
  const probe = recorded("probe");
  const extract = stageNode("extract", (state) =>
    Promise.resolve({
      drafts: state.retryCount === 0 ? first : second,
      gates: GATES_OUTPUT,
    }),
  );
  const nodes = {
    resolve: stageNode("resolve", () => Promise.resolve({ app: APP })),
    fetch: stageNode("fetch", () => Promise.resolve({ pages: PAGES })),
    search: search.fn,
    extract,
    verify: verifyNode,
    probe: probe.fn,
  };
  return { nodes, search, probe };
}
const claimEvents = (h: ReturnType<typeof createHarness>, type: string) =>
  h.events.flatMap((e) =>
    e.type === type && "claimId" in e ? [e.claimId] : [],
  );

describe("the retry edge with the real verify stage", () => {
  it("does not retry when steps and scopes are Sourced", async () => {
    const h = createHarness();
    const r = rig(DRAFTS, DRAFTS);
    const final = await h.run(r.nodes);
    expect(r.search.calls).toHaveLength(1);
    expect(final.missingSections).toEqual([]);
    expect(final.retryCount).toBe(0);
  });

  it("goes back to search once when no step quote matched, and the second pass clears the flag", async () => {
    const h = createHarness();
    const r = rig(withDrafts({ steps: badSteps }), DRAFTS);
    const final = await h.run(r.nodes);
    expect(r.search.calls.map((s) => s.missingSections)).toEqual([
      [],
      ["steps"],
    ]);
    expect(final.retryCount).toBe(1);
    expect(final.missingSections).toEqual([]);
    expect(final.claims.find((c) => c.id === "steps.0.detail")?.label).toBe(
      "sourced",
    );
    expect(r.probe.calls).toHaveLength(1);
  });

  it("retries at most once when the second pass still has no matched quote", async () => {
    const h = createHarness();
    const r = rig(
      withDrafts({ steps: badSteps }),
      withDrafts({ steps: badSteps }),
    );
    const final = await h.run(r.nodes);
    expect(r.search.calls).toHaveLength(2);
    expect(r.probe.calls).toHaveLength(1);
    expect(final.missingSections).toEqual(["steps"]);
    expect(final.claims.find((c) => c.id === "steps.0.detail")).toMatchObject({
      label: "uncertain",
      sources: [],
    });
  });

  it("retries for a scopes section that was not found, too", async () => {
    const h = createHarness();
    const r = rig(withDrafts({ scopes: { status: "unknown" } }), DRAFTS);
    await h.run(r.nodes);
    expect(r.search.calls.map((s) => s.missingSections)).toEqual([
      [],
      ["scopes"],
    ]);
  });

  it("reports each claim once: the second pass sends events only for what is new or changed", async () => {
    const h = createHarness();
    await h.run(rig(withDrafts({ steps: badSteps }), DRAFTS).nodes);
    expect(claimEvents(h, "claim.downgraded")).toEqual(["steps.0.detail"]);
    expect(
      claimEvents(h, "claim.verified").filter((id) => id === "scopes.0.reason"),
    ).toHaveLength(1);
    expect(
      claimEvents(h, "claim.verified").filter((id) => id === "steps.0.detail"),
    ).toHaveLength(1);
  });
});
