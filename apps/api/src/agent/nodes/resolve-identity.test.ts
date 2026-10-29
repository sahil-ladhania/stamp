/**
 * File: resolve-identity.test.ts
 * Purpose: Tests the identity the resolve stage derives from a name search: every official domain of a company and the product its page titles agree on.
 * Exports: (none)
 * Used by: vitest
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../lib/logger.js";
import { searchWeb } from "../../lib/tavily.js";
import { createHarness, makeState } from "../../test-support/graph-harness.js";
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
