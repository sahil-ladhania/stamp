/**
 * File: stub-guide.test.ts
 * Purpose: Tests that the stub guide is schema-valid and unmistakably marked as test data.
 * Exports: (none)
 * Used by: vitest
 */
import { GuideSchema } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import {
  STUB_APP_SUFFIX,
  STUB_DOMAIN,
  STUB_MARKER,
  STUB_SUMMARY,
  buildStubGuide,
  listClaims,
  stubPages,
} from "./stub-guide.js";

const asOf = new Date("2026-03-05T10:00:00.000Z");
const full = buildStubGuide({ slug: "google-calendar", partial: false, asOf });
const partial = buildStubGuide({
  slug: "google-calendar",
  partial: true,
  asOf,
});

describe("buildStubGuide", () => {
  it("passes the shared GuideSchema, full and partial", () => {
    expect(GuideSchema.safeParse(full).success).toBe(true);
    expect(GuideSchema.safeParse(partial).success).toBe(true);
  });

  it("is a live guide under the run's slug with a readable name", () => {
    expect(full).toMatchObject({
      slug: "google-calendar",
      mode: "live",
      asOf: asOf.toISOString(),
    });
    expect(full.appName).toBe(`Google Calendar ${STUB_APP_SUFFIX}`);
    expect(full.domain).toBe(STUB_DOMAIN);
  });

  it("uses the exact stub summary and marks every other claim", () => {
    expect(full.verdict.summary.text).toBe(
      "Stub guide: scripted test data, not real research",
    );
    expect(STUB_SUMMARY).toBe(full.verdict.summary.text);
    for (const claim of listClaims(full).filter(
      (c) => c.id !== "verdict.summary",
    )) {
      expect(claim.text.startsWith(STUB_MARKER)).toBe(true);
    }
  });

  it("sources every claim from reserved example domains only", () => {
    for (const claim of [...listClaims(full), ...listClaims(partial)]) {
      for (const source of claim.sources) {
        expect(new URL(source.url).hostname).toMatch(
          /(^|\.)example\.(com|net|org)$/,
        );
      }
    }
  });

  it("never claims anything was tested", () => {
    const labels = new Set(listClaims(full).map((claim) => claim.label));
    expect(labels.has("tested")).toBe(false);
    expect(labels).toEqual(new Set(["sourced", "uncertain"]));
  });

  it("has its difficulty from the rule, consistent with the breakdown", () => {
    expect(full.difficultyBreakdown.total).toBe(3);
    expect(full.difficulty).toBe(full.difficultyBreakdown.score);
  });

  it("marks a partial guide and leaves its late sections unresearched", () => {
    expect(full.coverage).toBe("full");
    expect(partial.coverage).toBe("partial");
    const late = partial.blockers[0];
    for (const claim of [
      late?.symptom,
      late?.cause,
      late?.fix,
      partial.limits[0],
    ]) {
      expect(claim?.label).toBe("uncertain");
      expect(claim?.text).toContain("time budget");
    }
  });

  it("points every source at a page the stub fetches", () => {
    const urls = new Set(stubPages("google-calendar").map((page) => page.url));
    for (const claim of listClaims(full)) {
      expect(urls.has(claim.sources[0]?.url ?? "")).toBe(true);
    }
  });

  it("contains no em dashes", () => {
    expect(JSON.stringify([full, partial])).not.toMatch(/\u2014/);
  });
});
