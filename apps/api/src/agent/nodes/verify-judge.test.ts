/**
 * File: verify-judge.test.ts
 * Purpose: Tests the support check inside the verify node: a rejected claim or gate is downgraded and reported, a failed check leaves the code's labels and marks the run partial, and the check can never upgrade.
 * Exports: (none)
 * Used by: vitest
 */
import type { Claim } from "@stamp/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import { GATES_OUTPUT } from "../../test-support/extract-replies.js";
import { createHarness } from "../../test-support/graph-harness.js";
import { result } from "../../test-support/node-fixtures.js";
import { verify } from "../../test-support/verify-helpers.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
vi.spyOn(logger, "info").mockImplementation(() => {});
const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };
const answer = (verdicts: unknown[]) =>
  model.mockResolvedValue({
    ok: true,
    data: { verdicts },
    model: "m",
    durationMs: 5,
    usage,
  } as never);
const v = (id: string, support = "supported", aboutProduct = "yes") => ({
  id,
  support,
  aboutProduct,
});
const labelOf = (claims: Claim[], id: string) =>
  claims.find((c) => c.id === id)?.label;

beforeEach(() => {
  model.mockReset();
  warn.mockClear();
});

describe("verifyNode support check", () => {
  it("asks once, about the Sourced claims and the gate, with the run's meter and the fast tier", async () => {
    answer([]);
    const h = createHarness();
    await verify({ gates: GATES_OUTPUT }, h);
    expect(model).toHaveBeenCalledTimes(1);
    expect(model.mock.calls[0]?.[0]).toBe("fast");
    const asked = JSON.stringify(model.mock.calls[0]?.[1].messages);
    expect(asked).toContain("steps.0.detail");
    expect(asked).toContain("gates.reviewGate");
    expect(model.mock.calls[0]?.[1]).toMatchObject({
      usage: h.deps.usage,
      runId: "run_1",
    });
  });

  it("downgrades a claim the quote does not support and reports it with the reason", async () => {
    answer([v("steps.0.detail", "unsupported")]);
    const { h, claims, update } = await verify({ gates: GATES_OUTPUT });
    expect(labelOf(claims, "steps.0.detail")).toBe("uncertain");
    expect(claims.find((c) => c.id === "steps.0.detail")?.sources).toEqual([]);
    expect(h.events).toContainEqual(
      expect.objectContaining({
        type: "claim.downgraded",
        claimId: "steps.0.detail",
        reason: "not_supported",
      }),
    );
    expect(update.partial).toBeUndefined();
  });

  it("reports a page about another product as off_product", async () => {
    answer([v("scopes.0.reason", "supported", "no")]);
    const { h } = await verify({ gates: GATES_OUTPUT });
    expect(h.events).toContainEqual(
      expect.objectContaining({
        claimId: "scopes.0.reason",
        reason: "off_product",
      }),
    );
  });

  it("makes a review gate its quote does not support unknown, and then asks for the retry", async () => {
    answer([v("gates.reviewGate", "unsupported")]);
    const { update } = await verify({ gates: GATES_OUTPUT });
    expect(update.gates).toMatchObject({
      reviewGate: "unknown",
      reviewGateEvidence: null,
    });
    expect(update.missingSections).toContain("reviewGate");
  });

  it("leaves every label as the code set it, and marks the run partial, when the check fails twice", async () => {
    model.mockRejectedValue(new Error("down"));
    const { claims, update } = await verify({ gates: GATES_OUTPUT });
    expect(labelOf(claims, "steps.0.detail")).toBe("sourced");
    expect(update.gates).toMatchObject({ reviewGate: "required_to_scale" });
    expect(update.partial).toBe(true);
    expect(model).toHaveBeenCalledTimes(2);
  });

  it("never upgrades: a time estimate stays Uncertain whatever the model says", async () => {
    answer([v("milestones.production.wait"), v("milestones.firstTest.effort")]);
    const { claims } = await verify({ gates: GATES_OUTPUT });
    expect(labelOf(claims, "milestones.production.wait")).toBe("uncertain");
    expect(labelOf(claims, "milestones.firstTest.effort")).toBe("uncertain");
  });

  it("asks nothing when the run has no app, and nothing when there is nothing Sourced and no gate", async () => {
    await verify({ app: null, gates: GATES_OUTPUT });
    await verify({ drafts: {}, gates: null });
    expect(model).not.toHaveBeenCalled();
  });

  it("uses the title a search found for the page, so a legacy page loses its label before any model call", async () => {
    answer([]);
    const { h, claims } = await verify({
      gates: GATES_OUTPUT,
      searchResults: [
        {
          ...result("https://docs.acme.com/oauth", "official"),
          title: "Legacy OAuth guide",
        },
      ],
    });
    expect(labelOf(claims, "steps.0.detail")).toBe("uncertain");
    expect(h.events).toContainEqual(
      expect.objectContaining({
        claimId: "steps.0.detail",
        reason: "stale_source",
      }),
    );
  });
});
