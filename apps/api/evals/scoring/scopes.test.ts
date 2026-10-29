/**
 * File: scopes.test.ts
 * Purpose: Tests scope name matching and the real, fake, off-surface and unverified classification against the golden set.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { loadGolden, type Golden } from "../lib/golden.js";
import { classifyScope, scopeKey, scoreScopes } from "./scopes.js";

const all = await loadGolden();
const golden = (slug: string): Golden => {
  const found = all.find((g) => g.slug === slug);
  if (!found) throw new Error(`no golden ${slug}`);
  return found;
};

describe("scopeKey", () => {
  it("lowercases and strips quotes and backticks", () => {
    expect(scopeKey("`Mail.Read`")).toBe("mail.read");
  });

  it("reduces a scope URL to its last path segment", () => {
    expect(scopeKey("https://www.googleapis.com/auth/gmail.readonly")).toBe(
      "gmail.readonly",
    );
    expect(scopeKey("https://graph.microsoft.com/User.Read")).toBe("user.read");
  });

  it("keeps the host when the URL has no path", () => {
    expect(scopeKey("https://mail.google.com/")).toBe("mail.google.com");
  });

  it("collapses spaces in capability names", () => {
    expect(scopeKey("Read   content")).toBe("read content");
  });
});

describe("classifyScope", () => {
  it("calls a short Gmail name real when the golden holds the full URL", () => {
    expect(classifyScope("gmail.readonly", golden("gmail"))).toBe("real");
  });

  it("calls the Workspace add-on scopes off-surface, not real", () => {
    expect(
      classifyScope(
        "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
        golden("gmail"),
      ),
    ).toBe("off_surface");
  });

  it("calls the tutorial scopes seen in the stored Microsoft guide fake", () => {
    expect(classifyScope("app.read", golden("microsoft"))).toBe("fake");
    expect(classifyScope("app.write", golden("microsoft"))).toBe("fake");
  });

  it("calls a description a fake scope when the provider uses scope strings", () => {
    expect(classifyScope("Read open message metadata", golden("gmail"))).toBe(
      "fake",
    );
  });

  it("calls generic placeholders fake for any app", () => {
    expect(classifyScope("your_scope", golden("github"))).toBe("fake");
    expect(classifyScope("example", golden("hubspot"))).toBe("fake");
  });

  it("leaves a well-formed scope the golden does not list as unverified", () => {
    expect(classifyScope("Files.ReadWrite", golden("microsoft"))).toBe(
      "unverified",
    );
    expect(classifyScope("read:packages", golden("github"))).toBe("unverified");
  });

  it("matches Notion capabilities case-insensitively", () => {
    expect(classifyScope("Read content", golden("notion"))).toBe("real");
  });
});

describe("scoreScopes", () => {
  it("counts each golden scope once and groups the rest", () => {
    const result = scoreScopes(
      [
        "User.Read",
        "https://graph.microsoft.com/User.Read",
        "Mail.Read",
        "app.read",
        "Files.ReadWrite",
      ],
      golden("microsoft"),
    );
    expect(result.real).toEqual(["User.Read", "Mail.Read"]);
    expect(result.fake).toEqual(["app.read"]);
    expect(result.unverified).toEqual(["Files.ReadWrite"]);
    expect(result.total).toBe(5);
  });

  it("returns empty groups for a guide with no scopes", () => {
    expect(scoreScopes([], golden("slack"))).toEqual({
      total: 0,
      real: [],
      fake: [],
      unverified: [],
      offSurface: [],
    });
  });
});
