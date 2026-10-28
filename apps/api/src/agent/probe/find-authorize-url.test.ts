/**
 * File: find-authorize-url.test.ts
 * Purpose: Tests finding the authorize URL a Sourced official claim quotes, and which claims the probe may upgrade.
 * Exports: (none)
 * Used by: vitest
 */
import type { Claim, SourceTier } from "@stamp/schema";
import { describe, expect, it } from "vitest";
import {
  findAuthorizeProbe,
  isAuthorizeUrl,
  urlsIn,
} from "./find-authorize-url.js";

const URL1 = "https://acme.com/oauth/authorize";
const make = (
  id: string,
  quote: string,
  over: Partial<Claim> = {},
  tier: SourceTier = "official",
): Claim => ({
  id,
  text: "A fact.",
  label: "sourced",
  sources: [{ url: "https://docs.acme.com/oauth", quote, tier }],
  ...over,
});

describe("urlsIn", () => {
  it("finds https URLs and drops the punctuation that ends a sentence", () => {
    expect(
      urlsIn(`Send users to ${URL1}. Then see (${URL1}), or "${URL1}"!`),
    ).toEqual([URL1, URL1, URL1]);
  });
  it("ignores http URLs and text without a URL", () => {
    expect(urlsIn("Use http://acme.com/authorize or nothing at all.")).toEqual(
      [],
    );
  });
});

describe("isAuthorizeUrl", () => {
  it.each([
    "https://acme.com/authorize",
    "https://acme.com/oauth/authorize",
    "https://acme.com/oauth2/v2/authorize",
    "https://acme.com/oauth/auth",
    "https://accounts.acme.com/o/oauth2/v2/auth",
    "https://acme.com/v1/authorization/",
    "https://acme.com/oauth/authorize?client_id=X",
  ])("recognises %s", (url) => {
    expect(isAuthorizeUrl(url)).toBe(true);
  });
  it.each([
    "https://acme.com/oauth/token",
    "https://acme.com/docs/authorize-your-app",
    "https://acme.com/authors",
    "https://acme.com/",
    "not a url",
  ])("does not recognise %s", (url) => {
    expect(isAuthorizeUrl(url)).toBe(false);
  });
});

describe("findAuthorizeProbe", () => {
  it("finds the URL and the claim that quotes it", () => {
    expect(
      findAuthorizeProbe(
        [make("steps.0.detail", `Redirect to ${URL1}.`)],
        "acme.com",
      ),
    ).toEqual({ url: URL1, claimIds: ["steps.0.detail"] });
  });

  it("lists every Sourced claim that quotes the same URL", () => {
    const claims = [
      make("steps.0.detail", `Open ${URL1} first.`),
      make("limits.0", "Unrelated limit text here."),
      make("requirements.0", `The endpoint ${URL1} is used.`),
    ];
    expect(findAuthorizeProbe(claims, "acme.com")?.claimIds).toEqual([
      "steps.0.detail",
      "requirements.0",
    ]);
  });

  it("needs a Sourced claim: an Uncertain or Tested-already claim does not start a probe", () => {
    expect(
      findAuthorizeProbe(
        [make("steps.0.detail", URL1, { label: "uncertain", sources: [] })],
        "acme.com",
      ),
    ).toBeNull();
    expect(
      findAuthorizeProbe(
        [make("steps.0.detail", URL1, { label: "uncertain" })],
        "acme.com",
      ),
    ).toBeNull();
  });

  it("needs an official source: a URL quoted by a forum post or a blog is not probed", () => {
    expect(
      findAuthorizeProbe(
        [make("steps.0.detail", URL1, {}, "forum")],
        "acme.com",
      ),
    ).toBeNull();
    expect(
      findAuthorizeProbe(
        [make("steps.0.detail", URL1, {}, "third_party")],
        "acme.com",
      ),
    ).toBeNull();
  });

  it("skips a URL the target guard refuses and takes the next one", () => {
    const claims = [
      make("a.0", "Use https://evil.com/oauth/authorize now."),
      make("a.1", "Use http://acme.com/oauth/authorize now."),
      make("a.2", `Use ${URL1} now.`),
    ];
    expect(findAuthorizeProbe(claims, "acme.com")).toEqual({
      url: URL1,
      claimIds: ["a.2"],
    });
  });

  it("returns null when no claim quotes an authorize URL", () => {
    expect(
      findAuthorizeProbe(
        [make("a.0", "See https://acme.com/docs for more.")],
        "acme.com",
      ),
    ).toBeNull();
    expect(findAuthorizeProbe([], "acme.com")).toBeNull();
  });
});
