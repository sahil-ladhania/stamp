/**
 * File: support-judge.test.ts
 * Purpose: Tests the support check with a fake model: what it asks about, that it can only downgrade, and that an outage or bad reply leaves the code's labels alone.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { structured } from "../../lib/openai.js";
import {
  OAUTH_URL,
  PAGE_INDEX,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import type { ClaimSlot } from "../guide/claim-slots.js";
import { applyToClaims, claimItems, runJudge } from "./support-judge.js";
import { verifyClaims } from "./verify-claims.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };
const reply = (verdicts: unknown[]) =>
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

const slot = (id: string, text = "Copy the client ID."): ClaimSlot => ({
  id,
  draft: claim(OAUTH_URL, QUOTES.secret, text),
  kind: "fact",
});
const verified = () =>
  verifyClaims(
    [slot("steps.0.detail"), slot("steps.1.detail")],
    PAGE_INDEX,
    new Set(),
  );
const app = { appName: "Acme", product: null };
const options = {
  now: () => 0,
  deadline: 10_000,
  usage: undefined,
  runId: "run_1",
};

beforeEach(() => model.mockReset());

describe("what the check asks about", () => {
  it("is every Sourced claim, with its quote and page, and nothing already Uncertain", () => {
    const items = claimItems(verified(), (url) =>
      url === OAUTH_URL ? "Create an OAuth app" : undefined,
    );
    expect(items.map((i) => i.id)).toEqual([
      "steps.0.detail",
      "steps.1.detail",
    ]);
    expect(items[0]).toMatchObject({
      claim: "Copy the client ID.",
      quote: QUOTES.secret,
    });
    expect(items[0]?.page).toContain("Create an OAuth app");
    expect(items[0]?.page).toContain("docs.acme.com/oauth");
    const uncertain = verifyClaims(
      [{ ...slot("a"), kind: "estimate" }],
      PAGE_INDEX,
      new Set(),
    );
    expect(claimItems(uncertain, () => undefined)).toEqual([]);
  });
});

describe("runJudge", () => {
  const items = claimItems(verified(), () => undefined);

  it("returns the verdict for every item the model answered, ignoring ids it was not asked about", async () => {
    reply([
      v("steps.0.detail"),
      v("steps.1.detail", "partly"),
      v("made.up", "unsupported"),
    ]);
    const verdicts = await runJudge(app, items, options);
    expect([...(verdicts ?? new Map()).keys()]).toEqual([
      "steps.0.detail",
      "steps.1.detail",
    ]);
  });

  it("asks the fast model once, with the schema, the prompt and the time left", async () => {
    reply([v("steps.0.detail"), v("steps.1.detail")]);
    await runJudge(app, items, options);
    expect(model).toHaveBeenCalledTimes(1);
    expect(model.mock.calls[0]?.[0]).toBe("fast");
    expect(model.mock.calls[0]?.[1]).toMatchObject({
      name: "judge_support",
      timeoutMs: 10_000,
    });
  });

  it("tries again once after a failed reply and then gives up with null", async () => {
    model.mockResolvedValue({
      ok: false,
      failure: "invalid_json",
      model: "m",
      durationMs: 1,
      usage,
    } as never);
    expect(await runJudge(app, items, options)).toBeNull();
    expect(model).toHaveBeenCalledTimes(2);
  });

  it("uses the second try when the first failed", async () => {
    model.mockRejectedValueOnce(new Error("network"));
    reply([v("steps.0.detail"), v("steps.1.detail")]);
    expect((await runJudge(app, items, options))?.size).toBe(2);
  });

  it("gives up with null when there is no time left, without calling the model", async () => {
    expect(
      await runJudge(app, items, { ...options, now: () => 9_999 }),
    ).toBeNull();
    expect(model).not.toHaveBeenCalled();
  });

  it("asks nothing when there are no items", async () => {
    expect(await runJudge(app, [], options)).toEqual(new Map());
    expect(model).not.toHaveBeenCalled();
  });
});

describe("applying the verdicts", () => {
  it("makes a claim the quote only partly supports Uncertain with no source, and keeps the rest Sourced", () => {
    const result = applyToClaims(
      verified(),
      new Map([
        [
          "steps.0.detail",
          { support: "partly" as const, aboutProduct: "yes" as const },
        ],
      ]),
    );
    expect(result.claims[0]).toMatchObject({
      label: "uncertain",
      sources: [],
      text: "Copy the client ID.",
    });
    expect(result.outcomes[0]).toMatchObject({
      label: "uncertain",
      downgrade: "not_supported",
    });
    expect(result.claims[1]?.label).toBe("sourced");
  });

  it("reports a page about another product as off_product", () => {
    const result = applyToClaims(
      verified(),
      new Map([
        [
          "steps.1.detail",
          { support: "supported" as const, aboutProduct: "no" as const },
        ],
      ]),
    );
    expect(result.outcomes[1]?.downgrade).toBe("off_product");
  });

  it("can never make an Uncertain claim Sourced", () => {
    const before = verifyClaims(
      [{ ...slot("a"), kind: "estimate" }],
      PAGE_INDEX,
      new Set(),
    );
    const after = applyToClaims(
      before,
      new Map([
        ["a", { support: "supported" as const, aboutProduct: "yes" as const }],
      ]),
    );
    expect(after).toEqual(before);
  });
});
