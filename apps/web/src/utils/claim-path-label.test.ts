/**
 * File: claim-path-label.test.ts
 * Purpose: Tests the claim id to words mapper for every id shape the agent writes, and for an id it does not know.
 * Exports: none
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { claimPathLabel } from "./claim-path-label";

describe("claimPathLabel", () => {
  it.each([
    ["verdict.summary", "Headline"],
    ["milestones.firstTest.effort", "First test, Time"],
    ["milestones.firstTest.wait", "First test, Waits on"],
    ["milestones.production.effort", "Production, Time"],
    ["milestones.production.wait", "Approval wait"],
    ["requirements.0", "Requirement 1"],
    ["scopes.2.reason", "Scope 3"],
    ["steps.2.detail", "Step 3, Detail"],
    ["steps.0.effort", "Step 1, Effort"],
    ["blockers.0.fix", "Blocker 1, Fix"],
    ["blockers.1.symptom", "Blocker 2, Symptom"],
    ["blockers.0.contact", "Blocker 1, Contact"],
    ["limits.0", "Limit 1"],
    ["conflicts.1.reason", "Conflict 2"],
  ])("reads %s as %s", (id, label) => {
    expect(claimPathLabel(id)).toBe(label);
  });

  it.each(["", "steps", "steps.x.detail", "steps.-1.detail", "steps.0.colour", "nonsense.0", "milestones.third.effort"])(
    "reads the unknown id %j as a plain claim",
    (id) => {
      expect(claimPathLabel(id)).toBe("Claim");
    },
  );
});
