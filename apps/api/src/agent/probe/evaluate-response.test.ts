/**
 * File: evaluate-response.test.ts
 * Purpose: Tests the probe's response rule: which statuses, bodies and redirects confirm a claim, and which leave it Sourced.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { evaluateResponse } from "./evaluate-response.js";

const URL1 = "https://acme.com/oauth/authorize?client_id=x";
const run = (status: number, body = "", location: string | null = null) =>
  evaluateResponse({ status, body, location }, URL1, "acme.com");

describe("evaluateResponse: client errors", () => {
  it.each([400, 401, 403])("passes a %i that names the client", (status) => {
    expect(run(status, '{"error":"invalid_client"}')).toEqual({
      passed: true,
      reason: "client_rejected",
    });
  });
  it.each([
    "Unknown client_id supplied",
    "redirect_uri is not registered",
    "INVALID_CLIENT",
  ])("passes on the words in %j", (body) => {
    expect(run(400, body).passed).toBe(true);
  });
  it.each([400, 401, 403])(
    "fails a %i that says nothing about the client",
    (status) => {
      expect(run(status, "Forbidden")).toEqual({
        passed: false,
        reason: "client_error_without_client_words",
      });
      expect(run(status, "").passed).toBe(false);
    },
  );
  it("does not pass a 200 or a 422 even when the body names the client", () => {
    expect(run(200, "invalid_client").passed).toBe(false);
    expect(run(422, "invalid_client").passed).toBe(false);
  });
});

describe("evaluateResponse: other statuses", () => {
  it("fails a 404", () => {
    expect(run(404, "invalid_client")).toEqual({
      passed: false,
      reason: "not_found",
    });
  });
  it.each([500, 502, 503, 599])("fails a %i", (status) => {
    expect(run(status, "invalid_client")).toEqual({
      passed: false,
      reason: "server_error",
    });
  });
  it.each([200, 204, 418])("fails an unexpected %i", (status) => {
    expect(run(status).reason).toBe("unexpected_status");
  });
});

describe("evaluateResponse: redirects", () => {
  it.each([301, 302, 303, 307, 308])(
    "passes a %i to a login page on the official domain",
    (status) => {
      expect(run(status, "", "https://acme.com/login?next=/oauth")).toEqual({
        passed: true,
        reason: "redirect_to_login",
      });
    },
  );
  it.each([
    "https://accounts.acme.com/signin",
    "https://acme.com/oauth/error?code=invalid",
    "/sign-in",
    "https://login.acme.com/sso/start",
    "https://acme.com/a?error=invalid_request",
  ])("passes a redirect to %s", (location) => {
    expect(run(302, "", location).passed).toBe(true);
  });
  it("fails a redirect to a login page off the official domain", () => {
    expect(run(302, "", "https://evil.com/login")).toEqual({
      passed: false,
      reason: "redirect_off_domain",
    });
    expect(run(302, "", "https://evilacme.com/login").passed).toBe(false);
  });
  it("fails a redirect to an ordinary page on the official domain", () => {
    expect(run(302, "", "https://acme.com/home")).toEqual({
      passed: false,
      reason: "redirect_not_login",
    });
  });
  it("fails a redirect with no usable location", () => {
    expect(run(302, "", null).passed).toBe(false);
    expect(run(302, "", "http://[bad").reason).toBe("bad_redirect");
  });
});
