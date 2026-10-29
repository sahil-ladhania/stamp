/**
 * File: verify.test.ts
 * Purpose: Tests the verify node: labels, claim events, conflicts, the gates evidence, the checks it records and the missing-sections flag.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import {
  OAUTH_URL,
  QUOTES,
  REVIEW_URL,
  claim,
} from "../../test-support/extract-fixtures.js";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import { trace } from "../../test-support/graph-harness.js";
import { drafted, withDrafts } from "../../test-support/guide-fixtures.js";
import type { CheckRecord } from "../../services/verification-log.js";
import { verify } from "../../test-support/verify-helpers.js";

vi.spyOn(logger, "info").mockImplementation(() => {});

const FAKE = "A sentence the page never contained at all.";
const steps = (quote: string) =>
  drafted<"steps">({
    steps: [
      {
        title: "Create the app",
        detail: claim(OAUTH_URL, quote),
        actor: "human",
        effort: null,
      },
    ],
  });

describe("verifyNode", () => {
  it("labels every claim and emits the stage events around the claim events", async () => {
    const { h, claims } = await verify();
    expect(claims.map((c) => c.id)).toEqual([
      "verdict.summary",
      "milestones.firstTest.effort",
      "milestones.production.wait",
      "requirements.0",
      "scopes.0.reason",
      "steps.0.detail",
      "blockers.0.symptom",
      "limits.0",
    ]);
    expect(trace(h.events)[0]).toBe("stage.started:5");
    expect(trace(h.events).at(-1)).toBe("stage.done:5");
  });

  it("emits claim.verified for each Sourced claim and nothing for the milestone estimates", async () => {
    const { h } = await verify();
    const verified = h.events
      .filter((e) => e.type === "claim.verified")
      .map((e) => "claimId" in e && e.claimId);
    expect(verified).toEqual([
      "verdict.summary",
      "requirements.0",
      "scopes.0.reason",
      "steps.0.detail",
      "blockers.0.symptom",
      "limits.0",
    ]);
    expect(h.events.some((e) => e.type === "claim.downgraded")).toBe(false);
  });

  it("emits claim.downgraded with quote_not_found when a quote is not on its page", async () => {
    const { h, claims } = await verify({
      drafts: withDrafts({ steps: steps(FAKE) }),
    });
    expect(claims.find((c) => c.id === "steps.0.detail")).toMatchObject({
      label: "uncertain",
      sources: [],
    });
    expect(h.events).toContainEqual(
      expect.objectContaining({
        type: "claim.downgraded",
        claimId: "steps.0.detail",
        reason: "quote_not_found",
      }),
    );
  });

  it("emits claim.downgraded with sources_disagree for a claim in a confirmed conflict", async () => {
    const conflicted = withDrafts({
      conflicts: drafted<"conflicts">({
        conflicts: [
          {
            topic: "Install cap",
            sourceA: claim(OAUTH_URL, QUOTES.cap, "The cap is 25."),
            sourceB: claim(
              REVIEW_URL,
              QUOTES.approval,
              "Over 25 installs need approval.",
            ),
            preferredUrl: OAUTH_URL,
            reason: claim(OAUTH_URL, QUOTES.cap),
          },
        ],
      }),
    });
    const { h, update } = await verify({ drafts: conflicted });
    expect(update.conflicts).toHaveLength(1);
    expect(h.events).toContainEqual(
      expect.objectContaining({
        type: "claim.downgraded",
        claimId: "limits.0",
        reason: "sources_disagree",
      }),
    );
    expect(h.events).toContainEqual(
      expect.objectContaining({
        type: "claim.downgraded",
        claimId: "requirements.0",
        reason: "sources_disagree",
      }),
    );
  });

  it("reports no missing section when the gate is known and steps, scopes and blockers have a Sourced claim", async () => {
    expect(
      (await verify({ gates: GATES_OUTPUT })).update.missingSections,
    ).toEqual([]);
  });

  it("reports steps as missing when none of its quotes matched, which triggers the retry", async () => {
    expect(
      (
        await verify({
          drafts: withDrafts({ steps: steps(FAKE) }),
          gates: GATES_OUTPUT,
        })
      ).update.missingSections,
    ).toEqual(["steps"]);
  });

  it("reports a section that was not found at all as missing", async () => {
    const { update } = await verify({
      drafts: withDrafts({ scopes: { status: "unknown" } }),
      gates: GATES_OUTPUT,
    });
    expect(update.missingSections).toEqual(["scopes"]);
  });

  it("returns the gates with only verified evidence: an unverified quote makes the fact unknown", async () => {
    const bad = {
      ...GATES_OUTPUT,
      reviewGateEvidence: claim(REVIEW_URL, FAKE),
    };
    const { update } = await verify({ gates: bad });
    expect(update.gates).toMatchObject({
      authMethod: "oauth",
      reviewGate: "unknown",
      reviewGateEvidence: null,
    });
  });

  it("returns null gates when there were none", async () => {
    expect((await verify({ gates: null })).update.gates).toBeNull();
  });

  it("returns one check per quote it looked at: claims, gates and conflicts", async () => {
    const { update } = await verify({ gates: GATES_OUTPUT });
    const checks = (update.checks ?? []) as CheckRecord[];
    const ids = checks.map((c) => c.claimId);
    expect(ids).toContain("steps.0.detail");
    expect(ids).toContain("gates.authEvidence");
    expect(checks.every((c) => c.method === "quote_match")).toBe(true);
  });

  it("does not repeat events for claims a first pass already reported unchanged", async () => {
    const first = await verify();
    const second = await verify({ claims: first.claims, retryCount: 1 });
    expect(second.h.events.filter((e) => e.type.startsWith("claim."))).toEqual(
      [],
    );
  });

  it("verifies nothing and emits no claim event when nothing was drafted", async () => {
    const { h, update } = await verify({ drafts: {} });
    expect(update.claims).toEqual([]);
    expect(update.missingSections).toEqual([
      "reviewGate",
      "steps",
      "scopes",
      "blockers",
    ]);
    expect(h.events.some((e) => e.type.startsWith("claim."))).toBe(false);
  });
});
