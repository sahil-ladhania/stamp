/**
 * File: claim-slots.test.ts
 * Purpose: Tests the claim ids and the slot list: every slot, its id, which are time estimates, and what is skipped.
 * Exports: (none)
 * Used by: vitest
 */
import { ClaimIdSchema } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import {
  OAUTH_URL,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import { DRAFTS, drafted } from "../../test-support/guide-fixtures.js";
import { claimSlots, slotId } from "./claim-slots.js";

describe("slotId", () => {
  it.each([
    [slotId.verdictSummary, "verdict.summary"],
    [slotId.milestone("firstTest", "effort"), "milestones.firstTest.effort"],
    [slotId.milestone("production", "wait"), "milestones.production.wait"],
    [slotId.requirement(2), "requirements.2"],
    [slotId.scope(0), "scopes.0"],
    [slotId.scopeReason(0), "scopes.0.reason"],
    [slotId.step(1), "steps.1"],
    [slotId.stepPart(1, "detail"), "steps.1.detail"],
    [slotId.blocker(0), "blockers.0"],
    [slotId.blockerPart(3, "contact"), "blockers.3.contact"],
    [slotId.limit(4), "limits.4"],
    [slotId.conflict(0), "conflicts.0"],
    [slotId.conflictReason(0), "conflicts.0.reason"],
  ])("builds %s", (id, expected) => {
    expect(id).toBe(expected);
    expect(ClaimIdSchema.safeParse(id).success).toBe(true);
  });
});

describe("claimSlots", () => {
  it("lists every claim the drafts hold, in guide order, with valid ids", () => {
    const ids = claimSlots(DRAFTS).map((slot) => slot.id);
    expect(ids).toEqual([
      "verdict.summary",
      "milestones.firstTest.effort",
      "milestones.production.wait",
      "requirements.0",
      "scopes.0.reason",
      "steps.0.detail",
      "blockers.0.symptom",
      "limits.0",
    ]);
    expect(ids.every((id) => ClaimIdSchema.safeParse(id).success)).toBe(true);
  });

  it("marks milestone claims and step effort as time estimates, and the rest as facts", () => {
    const withEffort = {
      ...DRAFTS,
      steps: drafted<"steps">({
        steps: [
          {
            title: "T",
            detail: claim(OAUTH_URL, QUOTES.secret),
            actor: "human",
            effort: claim(OAUTH_URL, QUOTES.rate),
          },
        ],
      }),
    };
    const kinds = Object.fromEntries(
      claimSlots(withEffort).map((s) => [s.id, s.kind]),
    );
    expect(kinds["milestones.firstTest.effort"]).toBe("estimate");
    expect(kinds["milestones.production.wait"]).toBe("estimate");
    expect(kinds["steps.0.effort"]).toBe("estimate");
    expect(kinds["steps.0.detail"]).toBe("fact");
    expect(kinds["requirements.0"]).toBe("fact");
  });

  it("skips null claims, such as a milestone the sources did not state", () => {
    expect(
      claimSlots(DRAFTS).some(
        (slot) => slot.id === "milestones.firstTest.wait",
      ),
    ).toBe(false);
  });

  it("skips sections that are unknown, failed or missing", () => {
    const slots = claimSlots({
      steps: { status: "unknown" },
      scopes: { status: "failed", reason: "timeout" },
    });
    expect(slots).toEqual([]);
  });

  it("numbers list items from 0 and gives each part of a blocker its own slot", () => {
    const blocker = {
      symptom: claim(OAUTH_URL, QUOTES.cap),
      cause: claim(OAUTH_URL, QUOTES.rate),
      fix: null,
      contact: claim(OAUTH_URL, QUOTES.secret),
    };
    const slots = claimSlots({
      blockers: drafted<"blockers">({ blockers: [blocker, blocker] }),
    });
    expect(slots.map((s) => s.id)).toEqual([
      "blockers.0.symptom",
      "blockers.0.cause",
      "blockers.0.contact",
      "blockers.1.symptom",
      "blockers.1.cause",
      "blockers.1.contact",
    ]);
  });

  it("carries the draft claim itself", () => {
    expect(claimSlots(DRAFTS)[0]?.draft).toEqual(
      DRAFTS.verdict?.status === "drafted"
        ? DRAFTS.verdict.payload.summary
        : null,
    );
  });
});
