/**
 * File: extract-decisions.test.ts
 * Purpose: Tests the extract stage's run-ending decisions: NOT_OAUTH, NO_PUBLIC_DOCS and INTERNAL.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { ModelCallError } from "../../lib/openai-client.js";
import { structured } from "../../lib/openai.js";
import { PAGES, claim } from "../../test-support/extract-fixtures.js";
import { replyBySection } from "../../test-support/extract-replies.js";
import {
  EMPTY,
  KEYS_URL,
  draftsOf,
  failureOf,
  keysGates,
  keysPage,
  state,
  useReplies,
} from "../../test-support/extract-node-helpers.js";
import { createHarness, trace } from "../../test-support/graph-harness.js";
import { extractNode } from "./extract.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
vi.spyOn(logger, "info").mockImplementation(() => {});
vi.spyOn(logger, "warn").mockImplementation(() => {});

beforeEach(() => {
  model.mockReset();
});

describe("NOT_OAUTH", () => {
  it("ends the run when the model says API keys only, the quote is on an official page and no steps or scopes were found", async () => {
    const h = createHarness();
    useReplies({ ...EMPTY, gates: keysGates });
    const update = await extractNode(state([keysPage]), h.config);
    expect(failureOf(update)).toMatchObject({ stage: 4, code: "NOT_OAUTH" });
    expect(trace(h.events)).toEqual(["stage.started:4"]);
  });

  it("does not end the run when the same app also has OAuth steps", async () => {
    const h = createHarness();
    useReplies({ gates: keysGates });
    expect(
      failureOf(await extractNode(state([...PAGES, keysPage]), h.config)),
    ).toBeUndefined();
  });

  it("does not end the run when the quote is not on the page, however sure the model sounds", async () => {
    const h = createHarness();
    useReplies({
      ...EMPTY,
      gates: {
        ...keysGates,
        authEvidence: claim(KEYS_URL, "We never support OAuth anywhere."),
      },
    });
    expect(
      failureOf(await extractNode(state([keysPage]), h.config)),
    ).toBeUndefined();
  });

  it("does not end the run when the model says both OAuth and API keys", async () => {
    const h = createHarness();
    useReplies({ ...EMPTY, gates: { ...keysGates, authMethod: "both" } });
    expect(
      failureOf(await extractNode(state([keysPage]), h.config)),
    ).toBeUndefined();
  });
});

describe("NO_PUBLIC_DOCS and INTERNAL", () => {
  it("ends the run with NO_PUBLIC_DOCS when every section answers unknown", async () => {
    const h = createHarness();
    useReplies({
      ...EMPTY,
      gates: { ...keysGates, authMethod: "unknown", authEvidence: null },
    });
    expect(failureOf(await extractNode(state(), h.config))).toMatchObject({
      stage: 4,
      code: "NO_PUBLIC_DOCS",
    });
  });

  it("ends the run with INTERNAL, not NO_PUBLIC_DOCS, when every call fails", async () => {
    const h = createHarness();
    model.mockRejectedValue(new ModelCallError("gpt-4.1", 500));
    expect(failureOf(await extractNode(state(), h.config))).toMatchObject({
      stage: 4,
      code: "INTERNAL",
    });
  });

  it("goes on when a few sections fail but others succeed, recording each failure", async () => {
    const h = createHarness();
    model.mockImplementation(((tier: string, options: { name: string }) =>
      options.name === "extract_scopes"
        ? Promise.reject(new ModelCallError("gpt-4.1", 500))
        : replyBySection()(tier, options)) as never);
    const update = await extractNode(state(), h.config);
    expect(failureOf(update)).toBeUndefined();
    expect(draftsOf(update).scopes).toEqual({
      status: "failed",
      reason: "model_error",
    });
    expect(draftsOf(update).steps?.status).toBe("drafted");
  });
});
