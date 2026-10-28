/**
 * File: claim-events.test.ts
 * Purpose: Tests the claim.verified and claim.downgraded events, and that a retry pass repeats none that is unchanged.
 * Exports: (none)
 * Used by: vitest
 */
import type { Claim } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import { claimEvents } from "./claim-events.js";
import type { ClaimOutcome } from "./verify-claims.js";

const URL = "https://docs.acme.com/oauth";
const claim = (id: string, label: Claim["label"], text = "A fact."): Claim => ({
  id,
  text,
  label,
  sources: [],
});
const outcome = (
  id: string,
  label: Claim["label"],
  downgrade: ClaimOutcome["downgrade"] = null,
): ClaimOutcome => ({ id, label, downgrade, url: URL });

describe("claimEvents", () => {
  it("emits claim.verified with the page url for a Sourced claim", () => {
    expect(
      claimEvents(
        [claim("steps.0.detail", "sourced")],
        [outcome("steps.0.detail", "sourced")],
        [],
      ),
    ).toEqual([
      { type: "claim.verified", claimId: "steps.0.detail", url: URL },
    ]);
  });

  it.each(["quote_not_found", "sources_disagree"] as const)(
    "emits claim.downgraded with the reason %s",
    (reason) => {
      expect(
        claimEvents(
          [claim("limits.0", "uncertain")],
          [outcome("limits.0", "uncertain", reason)],
          [],
        ),
      ).toEqual([{ type: "claim.downgraded", claimId: "limits.0", reason }]);
    },
  );

  it("emits nothing for a time estimate that is Uncertain by rule", () => {
    expect(
      claimEvents(
        [claim("milestones.production.wait", "uncertain")],
        [outcome("milestones.production.wait", "uncertain")],
        [],
      ),
    ).toEqual([]);
  });

  it("emits nothing for a claim the previous pass already reported unchanged", () => {
    const same = claim("steps.0.detail", "sourced");
    expect(claimEvents([same], [outcome(same.id, "sourced")], [same])).toEqual(
      [],
    );
  });

  it("emits again when the label changed since the previous pass", () => {
    const events = claimEvents(
      [claim("steps.0.detail", "uncertain")],
      [outcome("steps.0.detail", "uncertain", "quote_not_found")],
      [claim("steps.0.detail", "sourced")],
    );
    expect(events).toEqual([
      {
        type: "claim.downgraded",
        claimId: "steps.0.detail",
        reason: "quote_not_found",
      },
    ]);
  });

  it("emits again when the same id now holds a different claim", () => {
    const events = claimEvents(
      [claim("steps.0.detail", "sourced", "A new step.")],
      [outcome("steps.0.detail", "sourced")],
      [claim("steps.0.detail", "sourced", "An old step.")],
    );
    expect(events).toHaveLength(1);
  });

  it("keeps the events in claim order", () => {
    const events = claimEvents(
      [
        claim("a.0", "sourced"),
        claim("a.1", "uncertain"),
        claim("a.2", "sourced"),
      ],
      [
        outcome("a.0", "sourced"),
        outcome("a.1", "uncertain", "quote_not_found"),
        outcome("a.2", "sourced"),
      ],
      [],
    );
    expect(events.map((e) => ("claimId" in e ? e.claimId : ""))).toEqual([
      "a.0",
      "a.1",
      "a.2",
    ]);
  });
});
