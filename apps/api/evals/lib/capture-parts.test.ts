/**
 * File: capture-parts.test.ts
 * Purpose: Tests the pieces of a run's capture: the gate facts with their evidence, the search results with their detail, the resolve hits and the pages announced by events.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { QUOTES, REVIEW_URL } from "../../src/test-support/extract-fixtures.js";
import { GATES_OUTPUT } from "../../src/test-support/extract-replies.js";
import { readyState } from "../../src/test-support/save-helpers.js";
import {
  gatesOf,
  pagesFromEvents,
  resolveHitsOf,
  searchResultsOf,
} from "./capture-parts.js";

describe("gatesOf", () => {
  it("keeps the quote and URL behind each verified fact, with the tier of its page", () => {
    expect(gatesOf(readyState({ gates: GATES_OUTPUT }))).toEqual({
      reviewGate: "required_to_scale",
      reviewGateTier: "official",
      reviewGateEvidence: { url: REVIEW_URL, quote: QUOTES.approval },
      approvalWait: { minDays: 5, maxDays: 7 },
      approvalWaitTier: "official",
      approvalWaitEvidence: { url: REVIEW_URL, quote: QUOTES.review },
    });
  });

  it("has no evidence for a fact that is unknown", () => {
    const gates = {
      ...GATES_OUTPUT,
      approvalWait: "unknown" as const,
      approvalWaitMinDays: null,
      approvalWaitMaxDays: null,
    };
    const captured = gatesOf(readyState({ gates }));
    expect(captured.approvalWait).toBe("unknown");
    expect(captured.approvalWaitEvidence).toBeNull();
    expect(captured.reviewGateEvidence).not.toBeNull();
  });

  it("counts everything as unknown when verify did not run", () => {
    const captured = gatesOf(
      readyState({ gates: GATES_OUTPUT, completed: [0, 1, 2, 3, 4] }),
    );
    expect(captured).toEqual({
      reviewGate: "unknown",
      reviewGateTier: null,
      reviewGateEvidence: null,
      approvalWait: "unknown",
      approvalWaitTier: null,
      approvalWaitEvidence: null,
    });
  });

  it("has no tier when the evidence page was not held", () => {
    expect(
      gatesOf(readyState({ gates: GATES_OUTPUT, pages: [] })).reviewGateTier,
    ).toBeNull();
  });
});

describe("searchResultsOf", () => {
  it("keeps the title, score and topics of each result", () => {
    const results = [
      {
        url: "https://docs.acme.com/a",
        tier: "official" as const,
        title: "A",
        score: 0.8,
        topics: ["setup", "scopes"],
      },
      { url: "https://blog.example.net/b", tier: "third_party" as const },
    ];
    expect(searchResultsOf(results)).toEqual(results);
  });
});

describe("resolveHitsOf", () => {
  it("reads the hits the resolve stage logged", () => {
    const logs = [
      { message: "pages loaded" },
      {
        message: "resolve summary",
        resolveHits: [
          { url: "https://docs.acme.com/a", title: "Acme API" },
          { url: 42, title: "bad" },
          { url: "https://docs.acme.com/b" },
        ],
      },
    ];
    expect(resolveHitsOf(logs)).toEqual([
      { url: "https://docs.acme.com/a", title: "Acme API" },
    ]);
  });

  it("is empty when there is no resolve line or it has no hits", () => {
    expect(resolveHitsOf([])).toEqual([]);
    expect(resolveHitsOf([{ message: "resolve summary" }])).toEqual([]);
  });
});

describe("pagesFromEvents", () => {
  it("lists the pages the events announced, in order", () => {
    const events = [
      { tMs: 1, event: { type: "stage.started" } },
      {
        tMs: 2,
        event: {
          type: "page.fetched",
          url: "https://docs.acme.com/a",
          tier: "official",
        },
      },
    ];
    expect(pagesFromEvents(events)).toEqual([
      { url: "https://docs.acme.com/a", tier: "official" },
    ]);
  });
});
