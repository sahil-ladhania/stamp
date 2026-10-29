/**
 * File: jobs.test.ts
 * Purpose: Tests which searches run: all topics on the official domain then two open ones, or targeted retry searches.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { defaultQueries } from "../queries.js";
import { buildJobs } from "./jobs.js";

const app = { appName: "HubSpot", domain: "hubspot.com" };
const planned = defaultQueries(app.appName);

describe("buildJobs first pass", () => {
  it("searches every planned query on the official domain first, then the open topics across the web", () => {
    const jobs = buildJobs(app, planned, []);
    expect(jobs).toHaveLength(8);
    expect(
      jobs
        .slice(0, 6)
        .every((job) => job.includeDomains.join() === "hubspot.com"),
    ).toBe(true);
    expect(jobs.slice(0, 6).map((job) => job.query)).toEqual(
      planned.map((q) => q.text),
    );
    expect(jobs.slice(6).every((job) => job.includeDomains.length === 0)).toBe(
      true,
    );
  });

  it("makes the open searches from the review and approval-wait queries", () => {
    const open = buildJobs(app, planned, [])
      .slice(6)
      .map((job) => job.query);
    expect(open).toEqual([
      planned.find((q) => q.topic === "review")?.text,
      planned.find((q) => q.topic === "approvalWait")?.text,
    ]);
  });

  it("falls back to the default queries when the plan produced none", () => {
    expect(buildJobs(app, [], [])).toEqual(buildJobs(app, planned, []));
  });

  it("makes fewer open searches when the plan left those topics out", () => {
    const withoutOpen = planned.filter(
      (q) => q.topic !== "review" && q.topic !== "approvalWait",
    );
    expect(buildJobs(app, withoutOpen, [])).toHaveLength(4);
  });
});

describe("buildJobs retry pass", () => {
  it("searches only the official domain, with new wording for the missing sections", () => {
    const jobs = buildJobs(app, planned, ["steps", "scopes"]);
    expect(jobs).toHaveLength(2);
    expect(
      jobs.every((job) => job.includeDomains.join() === "hubspot.com"),
    ).toBe(true);
    for (const job of jobs) {
      expect(planned.map((q) => q.text)).not.toContain(job.query);
    }
  });

  it("makes at most two searches however many sections are missing", () => {
    expect(
      buildJobs(app, planned, ["steps", "scopes", "limits", "blockers"]),
    ).toHaveLength(2);
  });
});

describe("buildJobs topics", () => {
  it("tags each first-pass job with the topic of its query, the two open ones included", () => {
    const jobs = buildJobs(app, planned, []);
    expect(jobs.map((job) => job.topic)).toEqual([
      ...planned.map((q) => q.topic),
      "review",
      "approvalWait",
    ]);
  });

  it("tags each retry job with the topic of its retry query", () => {
    const jobs = buildJobs(app, planned, ["scopes"]);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.every((job) => typeof job.topic === "string")).toBe(true);
  });
});
