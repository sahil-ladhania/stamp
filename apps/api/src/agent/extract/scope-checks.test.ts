/**
 * File: scope-checks.test.ts
 * Purpose: Tests the code rules that decide whether a name the model called a scope is one: on its page, a single token (multi-word only on an official page), no placeholder or half name, not a bare host, not from an admin page.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { isRealScope } from "./scope-checks.js";

const page = (
  url: string,
  tier: "official" | "third_party" | "forum" = "official",
) => ({ url, tier });
const DOCS = page("https://docs.example.com/oauth/scopes");

describe("isRealScope", () => {
  it.each([
    ["chat:write", "chat:write lets an app post messages."],
    [
      "crm.objects.contacts.read",
      'Request "crm.objects.contacts.read" to read contacts.',
    ],
    [
      "https://www.googleapis.com/auth/gmail.readonly",
      "Use https://www.googleapis.com/auth/gmail.readonly to read mail.",
    ],
    ["User.Read", "The User.Read permission signs the user in."],
    ["repo", "repo: grants full access to repositories."],
    ["admin.apps:read", "The admin.apps:read scope lists apps."],
  ])(
    "accepts %s on an official page when its quote holds it",
    (name, quote) => {
      expect(isRealScope(name, quote, DOCS)).toBe(true);
    },
  );

  it("rejects a name the quote does not contain, whatever the case", () => {
    expect(
      isRealScope("chat:write", "The scope lets an app post messages.", DOCS),
    ).toBe(false);
    expect(isRealScope("Chat:Write", "chat:write posts messages", DOCS)).toBe(
      true,
    );
  });

  it.each([
    "<scope>",
    "{scope}",
    "your_scope",
    "my-scope",
    "example_scope",
    "sample:read",
    "scope:xxx",
    "SCOPE_NAME_HERE",
    "*",
    "...",
  ])("rejects the placeholder %s", (name) => {
    expect(isRealScope(name, `Use ${name} to do things.`, DOCS)).toBe(false);
  });

  it.each(["session:role:", "user:", "read-", "scope_"])(
    "rejects the unfinished name %s",
    (name) => {
      expect(isRealScope(name, `Use ${name} here.`, DOCS)).toBe(false);
    },
  );

  it("rejects a bare host name, but not a scope that is a URL", () => {
    expect(
      isRealScope(
        "mail.google.com",
        "Open mail.google.com to read mail.",
        DOCS,
      ),
    ).toBe(false);
    expect(
      isRealScope(
        "https://mail.google.com/",
        "Full access is https://mail.google.com/ .",
        DOCS,
      ),
    ).toBe(true);
  });

  it("lets a multi-word capability name through only on an official page", () => {
    const quote = "The Read content capability lets an integration read pages.";
    expect(isRealScope("Read content", quote, DOCS)).toBe(true);
    expect(
      isRealScope(
        "Read content",
        quote,
        page("https://blog.example.net/p", "third_party"),
      ),
    ).toBe(false);
  });

  it.each([
    "https://developers.example.com/reference/admin/scopes",
    "https://docs.example.com/admins/managing-apps",
    "https://docs.example.com/guides/administration/permissions",
  ])(
    "rejects a name from an admin page, a different surface from an app's own: %s",
    (url) => {
      expect(
        isRealScope(
          "legal-hold:read",
          "legal-hold:read reads legal holds.",
          page(url),
        ),
      ).toBe(false);
    },
  );

  it("does not take a page for an admin page because a word in its path contains admin", () => {
    expect(
      isRealScope(
        "chat:write",
        "chat:write posts.",
        page("https://docs.example.com/administrative-faq"),
      ),
    ).toBe(true);
  });

  it("rejects an empty or very long name", () => {
    expect(isRealScope("", "x", DOCS)).toBe(false);
    expect(isRealScope("a".repeat(200), "a".repeat(200), DOCS)).toBe(false);
  });
});
