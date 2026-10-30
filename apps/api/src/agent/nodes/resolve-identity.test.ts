/**
 * File: resolve-identity.test.ts
 * Purpose: Tests the identity the resolve stage derives from a name search: every official domain of a company and the product its page titles agree on.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { searchWeb } from "../../lib/tavily.js";
import { RUN_ERROR_MESSAGES } from "../../services/run-messages.js";
import {
  createHarness,
  makeState,
  trace,
} from "../../test-support/graph-harness.js";
import { hit } from "../../test-support/node-fixtures.js";
import { RESOLVE_QUERY, resolveNode } from "./resolve.js";

vi.mock("../../lib/tavily.js", () => ({
  searchWeb: vi.fn(),
  extractPages: vi.fn(),
}));
const search = vi.mocked(searchWeb);
vi.spyOn(logger, "info").mockImplementation(() => {});

beforeEach(() => {
  search.mockReset();
});

describe("resolveNode identity", () => {
  it("keeps every documentation domain of the company and the product its titles agree on", async () => {
    const h = createHarness();
    search.mockResolvedValue({
      hits: [
        hit("https://docs.slack.dev/", 0.9, "Slack developer docs"),
        hit("https://slack.com/help/articles/1", 0.8, "Slack help"),
        hit("https://api.slack.com/authentication", 0.7, "Slack API guide"),
        hit("https://slack.dev/", 0.6, "Slack API reference"),
      ],
      credits: 1,
    });
    const update = await resolveNode(
      makeState({ typed: "Slack", slug: "slack" }),
      h.config,
    );
    const app = update.app as { domains: string[]; product: string | null };
    expect([...app.domains].sort()).toEqual(["slack.com", "slack.dev"]);
    expect(app.product).toBe("Slack API");
    expect(update.app).toMatchObject({ domain: app.domains[0] });
  });

  it("names the product a company's pages share when its domain is not the app's name", async () => {
    const h = createHarness();
    search.mockResolvedValue({
      hits: [
        hit(
          "https://developers.google.com/workspace/gmail/api/guides",
          0.9,
          "Gmail API overview  |  Google for Developers",
        ),
        hit(
          "https://developers.google.com/workspace/gmail/api/reference/rest",
          0.8,
          "Gmail API  |  Google for Developers",
        ),
      ],
      credits: 1,
    });
    const update = await resolveNode(makeState({ typed: "Gmail" }), h.config);
    expect(update.app).toMatchObject({
      domain: "google.com",
      domains: ["google.com"],
      product: "Gmail API",
    });
  });
});

describe("RESOLVE_QUERY", () => {
  it("searches by the name and API documentation only, with no generic OAuth words that pull in another product's pages", () => {
    expect(RESOLVE_QUERY("Gmail")).toBe("Gmail API developer documentation");
    expect(RESOLVE_QUERY("Gmail")).not.toMatch(/oauth/i);
  });
});

describe("resolveNode when two brands are a close call", () => {
  const found = (...urls: string[]) =>
    search.mockResolvedValue({ hits: urls.map((url) => hit(url)), credits: 1 });

  it("ends the run with AMBIGUOUS_APP and the options when two apps match about equally", async () => {
    const h = createHarness();
    // The named domain leads by the exact-label weight; a docs host with the better positions keeps the other close.
    found(
      "https://docs.mercuryapp.io/x",
      "https://docs.mercuryapp.io/y",
      "https://mercury.com/",
    );
    const update = await resolveNode(makeState({ typed: "Mercury" }), h.config);
    expect(update.failure).toEqual({
      stage: 0,
      code: "AMBIGUOUS_APP",
      message: RUN_ERROR_MESSAGES.AMBIGUOUS_APP,
      options: [
        { name: "Mercury", domain: "mercury.com" },
        { name: "Mercuryapp", domain: "mercuryapp.io" },
      ],
    });
    expect(update.app).toBeUndefined();
    // A question is a thin answer, so the node looked a second time before asking.
    expect(trace(h.events)).toEqual([
      "stage.started:0",
      "search.query",
      "search.query",
    ]);
  });
});

describe("resolveNode and the app.resolved event", () => {
  const events = (h: ReturnType<typeof createHarness>) =>
    h.events.filter((e) => e.type === "app.resolved");

  it("says what the run will research: the app, its primary domain and the product phrase", async () => {
    const h = createHarness();
    search.mockResolvedValue({
      hits: [
        hit(
          "https://developers.google.com/workspace/gmail/api/guides",
          0.9,
          "Gmail API overview  |  Google for Developers",
        ),
        hit(
          "https://developers.google.com/workspace/gmail/api/reference/rest",
          0.8,
          "Gmail API  |  Google for Developers",
        ),
      ],
      credits: 1,
    });
    await resolveNode(makeState({ typed: "Gmail" }), h.config);
    expect(events(h)).toEqual([
      {
        type: "app.resolved",
        runId: "run_1",
        appName: "Gmail",
        domain: "google.com",
        product: "Gmail API",
      },
    ]);
  });

  it("sends a null product when there is none, and for a typed domain", async () => {
    const h = createHarness();
    search.mockResolvedValue({
      hits: [hit("https://developers.notion.com/docs")],
      credits: 1,
    });
    await resolveNode(makeState({ typed: "Notion" }), h.config);
    expect(events(h)[0]).toMatchObject({ domain: "notion.com", product: null });
    const typed = createHarness();
    await resolveNode(
      makeState({ typed: "https://developers.notion.com/docs" }),
      typed.config,
    );
    expect(events(typed)[0]).toMatchObject({
      appName: "Notion",
      domain: "notion.com",
      product: null,
    });
  });

  it("sends nothing when the name is a close call or matches nothing", async () => {
    const h = createHarness();
    search.mockResolvedValue({ hits: [], credits: 1 });
    await resolveNode(makeState({ typed: "Notion" }), h.config);
    expect(events(h)).toEqual([]);
  });
});
