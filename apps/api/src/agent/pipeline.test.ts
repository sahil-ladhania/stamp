/**
 * File: pipeline.test.ts
 * Purpose: Tests the stage order, stage names and the partial-run rule.
 * Exports: (none)
 * Used by: vitest
 */
import { STAGES, type StageId } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import { NODE_CAP_MS } from "./budget.js";
import { PIPELINE, isPartial, stageName, stageOf } from "./pipeline.js";

const ALL: StageId[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const BEFORE_SAVE: StageId[] = [0, 1, 2, 3, 4, 5, 6, 7];

describe("PIPELINE", () => {
  it("lists stages 0 to 8 in order, once each", () => {
    expect(PIPELINE.map((item) => item.stage)).toEqual(ALL);
  });

  it("uses exactly the budget node names, so every node has a time cap", () => {
    expect(PIPELINE.map((item) => item.node).sort()).toEqual(
      Object.keys(NODE_CAP_MS).sort(),
    );
  });

  it("starts with resolve and ends with save", () => {
    expect(PIPELINE[0]?.node).toBe("resolve");
    expect(PIPELINE[8]?.node).toBe("save");
  });
});

describe("stageOf and stageName", () => {
  it("maps each node to its stage number", () => {
    for (const { node, stage } of PIPELINE) {
      expect(stageOf(node)).toBe(stage);
    }
  });

  it("rejects a node that is not in the pipeline", () => {
    expect(() => stageOf("nope" as never)).toThrow(RangeError);
  });

  it("uses the display names from @stamp/schema", () => {
    expect(ALL.map(stageName)).toEqual(STAGES.map((stage) => stage.name));
    expect(stageName(0)).toBe("resolve_app");
    expect(stageName(8)).toBe("save");
  });
});

describe("isPartial", () => {
  it("is false when stages 0 to 7 completed and nothing flagged it", () => {
    expect(isPartial({ partial: false, completed: BEFORE_SAVE })).toBe(false);
  });

  it("does not need save itself to have completed", () => {
    expect(isPartial({ partial: false, completed: ALL })).toBe(false);
  });

  it("is true when a node flagged the run", () => {
    expect(isPartial({ partial: true, completed: ALL })).toBe(true);
  });

  it.each(BEFORE_SAVE)("is true when stage %i never completed", (missing) => {
    const completed = BEFORE_SAVE.filter((stage) => stage !== missing);
    expect(isPartial({ partial: false, completed })).toBe(true);
  });

  it("is true when nothing completed", () => {
    expect(isPartial({ partial: false, completed: [] })).toBe(true);
  });
});
