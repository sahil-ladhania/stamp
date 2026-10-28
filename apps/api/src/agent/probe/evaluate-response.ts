/**
 * File: evaluate-response.ts
 * Purpose: Applies the plan's response rule: what a probe response must look like for the claim to be Tested.
 * Exports: evaluateResponse, Evaluation
 * Used by: agent/probe/probe-url.ts
 */
import { isUnderDomain, normalizeDomain } from "../evidence/source-tier.js";

export type Evaluation = { passed: boolean; reason: string };

/** An error from the provider that names the client or the redirect: the endpoint is real and rejected our dummy client. */
const CLIENT_ERROR_WORDS = /invalid_client|client_id|redirect_uri/i;
const CLIENT_ERROR_STATUSES = new Set([400, 401, 403]);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const LOGIN_OR_ERROR =
  /log-?in|sign-?in|sso|error|invalid|denied|unauthori[sz]ed/i;

export type ProbeResponse = {
  status: number;
  /** At most the first 4 KB. */
  body: string;
  location: string | null;
};

/**
 * Passes on: 400, 401 or 403 whose body mentions invalid_client, client_id or redirect_uri; or a 3xx to a
 * login or error page on the official domain. Everything else fails: 404, 5xx, other statuses, a 4xx that says
 * nothing about the client, a redirect off the official domain. A failed probe changes no label.
 */
export function evaluateResponse(
  response: ProbeResponse,
  requestUrl: string,
  officialDomain: string,
): Evaluation {
  const { status } = response;
  if (CLIENT_ERROR_STATUSES.has(status)) {
    return CLIENT_ERROR_WORDS.test(response.body)
      ? { passed: true, reason: "client_rejected" }
      : { passed: false, reason: "client_error_without_client_words" };
  }
  if (REDIRECT_STATUSES.has(status)) {
    return evaluateRedirect(response.location, requestUrl, officialDomain);
  }
  if (status === 404) return { passed: false, reason: "not_found" };
  if (status >= 500) return { passed: false, reason: "server_error" };
  return { passed: false, reason: "unexpected_status" };
}

function evaluateRedirect(
  location: string | null,
  requestUrl: string,
  officialDomain: string,
): Evaluation {
  let target: URL;
  try {
    target = new URL(location ?? "", requestUrl);
  } catch {
    return { passed: false, reason: "bad_redirect" };
  }
  if (
    !isUnderDomain(
      target.hostname.toLowerCase(),
      normalizeDomain(officialDomain),
    )
  ) {
    return { passed: false, reason: "redirect_off_domain" };
  }
  return LOGIN_OR_ERROR.test(`${target.pathname}${target.search}`)
    ? { passed: true, reason: "redirect_to_login" }
    : { passed: false, reason: "redirect_not_login" };
}
