/**
 * File: extract-retry.test.ts
 * Purpose: Tests the extract stage's retry pass: only the sections verify reported, the verdict when it is stale, the smaller time window.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { structured } from "../../lib/openai.js";
import {
  GATES_OUTPUT,
  REQUIREMENTS_OUTPUT,
} from "../../test-support/extract-replies.js";
import {
  EMPTY,
  draftsOf,
  failureOf,
  state,
  useReplies,
} from "../../test-support/extract-node-helpers.js";
import { createHarness } from "../../test-support/graph-harness.js";
import { extractNode } from "./extract.js";
import type { Drafts } from "../state.js";

vi.mock("../../lib/openai.js", () => ({ structured: vi.fn() }));
const model = vi.mocked(structured);
const info = vi.spyOn(logger, "info");
vi.spyOn(logger, "warn").mockImplementation(() => {});

const earlier: Drafts = {
  requirements: { status: "drafted", payload: REQUIREMENTS_OUTPUT },
  steps: { status: "unknown" },
  scopes: { status: "unknown" },
};
const retry = (missing: string[], extra: Parameters<typeof state>[1] = {}) =>
  state(undefined, {
    retryCount: 1,
    missingSections: missing,
    drafts: earlier,
    gates: GATES_OUTPUT,
    ...extra,
  });
const names = () => model.mock.calls.map(([, o]) => o.name);

beforeEach(() => {
  model.mockReset();
  info.mockReset().mockImplementation(() => {});
  useReplies();
});

describe("extractNode retry pass", () => {
  it("redoes only the missing section and the verdict that points into it", async () => {
    const h = createHarness();
    const update = await extractNode(retry(["steps"]), h.config);
    expect(names()).toEqual(["extract_steps", "extract_verdict"]);
    expect(Object.keys(draftsOf(update)).sort()).toEqual(["steps", "verdict"]);
  });

  it("leaves the gates alone: the update carries no gates", async () => {
    const h = createHarness();
    const update = await extractNode(retry(["steps"]), h.config);
    expect("gates" in update).toBe(false);
  });

  it("does not redo the verdict for scopes alone", async () => {
    const h = createHarness();
    await extractNode(retry(["scopes"]), h.config);
    expect(names()).toEqual(["extract_scopes"]);
  });

  it("redoes both sections, then the verdict", async () => {
    const h = createHarness();
    await extractNode(retry(["steps", "scopes"]), h.config);
    expect(names().slice(0, 2).sort()).toEqual([
      "extract_scopes",
      "extract_steps",
    ]);
    expect(names()[2]).toBe("extract_verdict");
  });

  it("does nothing, and makes no call, when verify named no section it knows", async () => {
    const h = createHarness();
    const update = await extractNode(retry(["verdict", "nonsense"]), h.config);
    expect(update).toEqual({ completed: [4] });
    expect(model).not.toHaveBeenCalled();
  });

  it("gives the verdict the new steps together with the blockers from the earlier pass", async () => {
    const h = createHarness();
    const blockers = {
      status: "drafted" as const,
      payload: {
        blockers: [
          {
            symptom: {
              text: "Installs stop at 25",
              quote: "Each app can be installed on up to 25 accounts",
              url: "https://docs.acme.com/oauth",
            },
            cause: null,
            fix: null,
            contact: null,
          },
        ],
      },
    };
    await extractNode(
      retry(["steps"], { drafts: { ...earlier, blockers } }),
      h.config,
    );
    const verdict = model.mock.calls.find(
      ([, o]) => o.name === "extract_verdict",
    );
    const text = verdict?.[1].messages[1]?.content ?? "";
    expect(text).toContain("Steps:\n0. Create the app");
    expect(text).toContain("Blockers:\n0. Installs stop at 25");
  });

  it("uses all the pages held, including the ones the retry fetched", async () => {
    const h = createHarness();
    await extractNode(retry(["steps"]), h.config);
    const text = model.mock.calls[0]?.[1].messages[1]?.content ?? "";
    expect(text).toContain("https://docs.acme.com/oauth");
  });

  it("goes on when the retry still finds nothing, because the earlier pass drafted something", async () => {
    const h = createHarness();
    useReplies({ ...EMPTY });
    const update = await extractNode(
      retry(["steps"], { gates: null }),
      h.config,
    );
    expect(failureOf(update)).toBeUndefined();
    expect(draftsOf(update).steps).toEqual({ status: "unknown" });
  });

  it("takes the retry's own 18 s window, and logs it as a retry pass", async () => {
    const h = createHarness();
    await extractNode(retry(["steps"]), h.config);
    expect(model.mock.calls[0]?.[1].timeoutMs).toBe(18_000);
    const summary = info.mock.calls.find(
      ([message]) => message === "extract summary",
    );
    expect(summary?.[1]).toMatchObject({ retryPass: true, windowMs: 18_000 });
  });

  it("keeps the first-pass wording when the retry count is 0", async () => {
    const h = createHarness();
    await extractNode(
      state(undefined, { missingSections: ["steps"] }),
      h.config,
    );
    expect(model).toHaveBeenCalledTimes(9);
  });
});
