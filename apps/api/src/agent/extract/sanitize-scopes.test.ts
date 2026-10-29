/**
 * File: sanitize-scopes.test.ts
 * Purpose: Tests that the scopes cleaner keeps real scope names and drops placeholders, names its quote lacks and names from admin pages.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import {
  OAUTH_URL,
  PAGE_INDEX,
  QUOTES,
  claim,
} from "../../test-support/extract-fixtures.js";
import { pageRecord } from "../../test-support/node-fixtures.js";
import { indexPages } from "./sanitize.js";
import { sanitizeSection } from "./sanitize.js";

const ADMIN_URL = "https://docs.acme.com/reference/admin/scopes";
const pages = indexPages([
  ...PAGE_INDEX.values(),
  pageRecord(
    ADMIN_URL,
    "official",
    "The legal-hold:read scope reads legal holds.",
  ),
]);
const scope = (name: string, url: string, quote: string) => ({
  name,
  reason: claim(url, quote, "What the scope allows."),
});
const clean = (...scopes: ReturnType<typeof scope>[]) =>
  sanitizeSection("scopes", { scopes }, { pages }).output.scopes.map(
    (s) => s.name,
  );

describe("sanitizeSection scopes", () => {
  it("keeps a scope whose quote holds its name on a fetched page", () => {
    expect(clean(scope("contacts.read", OAUTH_URL, QUOTES.scope))).toEqual([
      "contacts.read",
    ]);
  });

  it("drops a name its quote does not hold, a placeholder, and a half name", () => {
    expect(
      clean(
        scope("contacts.delete", OAUTH_URL, QUOTES.scope),
        scope("your_scope", OAUTH_URL, "Use your_scope here."),
        scope("session:role:", OAUTH_URL, "Use session:role: here."),
      ),
    ).toEqual([]);
  });

  it("drops the scopes of an admin page, a different surface from an app's own", () => {
    expect(
      clean(
        scope(
          "legal-hold:read",
          ADMIN_URL,
          "The legal-hold:read scope reads legal holds.",
        ),
        scope("contacts.read", OAUTH_URL, QUOTES.scope),
      ),
    ).toEqual(["contacts.read"]);
  });

  it("still drops a scope whose page was not fetched, and counts it", () => {
    const cleaned = sanitizeSection(
      "scopes",
      {
        scopes: [
          scope(
            "chat:write",
            "https://elsewhere.example/p",
            "chat:write posts.",
          ),
        ],
      },
      { pages },
    );
    expect(cleaned.output.scopes).toEqual([]);
    expect(cleaned.dropped).toBe(1);
  });
});
