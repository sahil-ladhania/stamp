/**
 * File: target.test.ts
 * Purpose: Tests the first SSRF guard: https, port 443, the official domain, no credentials and no IP-address hosts.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { checkTarget } from "./target.js";

const reason = (url: string, domain = "acme.com") => {
  const check = checkTarget(url, domain);
  return check.ok ? "ok" : check.reason;
};

describe("checkTarget", () => {
  it.each([
    "https://acme.com/oauth/authorize",
    "https://www.acme.com/oauth/authorize",
    "https://developers.acme.com/oauth/authorize?x=1",
    "https://app.acme.com:443/authorize",
    "https://ACME.com./authorize",
  ])("accepts %s", (url) => {
    expect(reason(url)).toBe("ok");
  });

  it.each([
    ["http://acme.com/authorize", "not_https"],
    ["ftp://acme.com/authorize", "not_https"],
    ["https://acme.com:8443/authorize", "port_not_443"],
    ["https://user:pass@acme.com/authorize", "has_credentials"],
    ["https://user@acme.com/authorize", "has_credentials"],
    ["https://127.0.0.1/authorize", "ip_literal"],
    ["https://[::1]/authorize", "ip_literal"],
    ["https://2130706433/authorize", "ip_literal"],
    ["https://0x7f.0.0.1/authorize", "ip_literal"],
    ["https://evilacme.com/authorize", "not_official_domain"],
    ["https://acme.com.evil.com/authorize", "not_official_domain"],
    ["https://evil.com/?u=acme.com", "not_official_domain"],
    ["https://acme.com@evil.com/authorize", "has_credentials"],
    ["not a url", "invalid_url"],
    ["", "invalid_url"],
  ])("refuses %s (%s)", (url, expected) => {
    expect(reason(url)).toBe(expected);
  });

  it("accepts the domain as a URL or with www", () => {
    expect(reason("https://acme.com/a", "https://www.acme.com/")).toBe("ok");
  });

  it("refuses a documentation platform host named after the app: it is official for reading, never for the probe", () => {
    expect(reason("https://acme.readme.io/oauth/authorize", "acme.com")).toBe(
      "not_official_domain",
    );
  });

  it("refuses a company's other documentation domain: only the primary domain is probed", () => {
    expect(reason("https://slack.dev/oauth", "slack.com")).toBe(
      "not_official_domain",
    );
    expect(reason("https://slack.com/oauth", "slack.com")).toBe("ok");
  });

  it("refuses everything when the official domain is empty", () => {
    expect(reason("https://acme.com/a", "")).toBe("not_official_domain");
  });
});
