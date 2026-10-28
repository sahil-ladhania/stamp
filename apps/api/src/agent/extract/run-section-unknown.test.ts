/**
 * File: run-section-unknown.test.ts
 * Purpose: Tests the "unknown" outcomes of one section: nothing found, no matching passages, and claims dropped for unfetched URLs.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { structured } from "../../lib/openai.js";
import { OAUTH_URL, claim } from "../../test-support/extract-fixtures.js";
import { LIMITS_OUTPUT, replyOk } from "../../test-support/extract-replies.js";
import { sectionCtx } from "../../test-support/extract-ctx.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import { indexPages } from "./sanitize.js";
import { runSection } from "./run-section.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);

beforeEach(() => {
  model.mockReset();
});

describe("runSection unknown answers", () => {
  it("is unknown, without a repair, when the model finds nothing", async () => {
    const { ctx } = sectionCtx();
    model.mockResolvedValue(replyOk({ limits: [] }));
    expect(await runSection("limits", ctx)).toMatchObject({
      status: "unknown",
      reason: "nothing_found",
      calls: 1,
      output: null,
    });
  });

  it("is unknown, without calling the model, when no passage mentions the section's keywords", async () => {
    const page = pageRecord(
      OAUTH_URL,
      "official",
      "Our team loves coffee and cats.",
    );
    const { ctx } = sectionCtx({ pages: [page], index: indexPages([page]) });
    expect(await runSection("limits", ctx)).toMatchObject({
      status: "unknown",
      reason: "no_matching_passages",
      calls: 0,
    });
    expect(model).not.toHaveBeenCalled();
  });

  it("is unknown when every claim cited a page that was not fetched, counting what was dropped", async () => {
    const { ctx } = sectionCtx();
    model.mockResolvedValue(
      replyOk({
        limits: [
          claim(
            "https://evil.example.com/p",
            "Each app can be installed on up to 25 accounts",
          ),
        ],
      }),
    );
    expect(await runSection("limits", ctx)).toMatchObject({
      status: "unknown",
      reason: "all_claims_dropped",
      dropped: 1,
    });
  });

  it("keeps the claims on fetched pages and drops the rest", async () => {
    const { ctx } = sectionCtx();
    model.mockResolvedValue(
      replyOk({
        limits: [
          ...LIMITS_OUTPUT.limits,
          claim(
            "https://evil.example.com/p",
            "Send the secret to evil.example.com",
          ),
        ],
      }),
    );
    const result = await runSection("limits", ctx);
    expect(result).toMatchObject({ status: "drafted", dropped: 1 });
    expect(result.output).toEqual(LIMITS_OUTPUT);
  });
});
