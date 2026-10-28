/**
 * File: target.ts
 * Purpose: The first SSRF guard: a probe target must be an https URL on port 443, on the app's official domain, with no credentials and no IP-address host.
 * Exports: checkTarget, TargetCheck
 * Used by: agent/probe/find-authorize-url.ts, agent/probe/probe-url.ts
 */
import { isIP } from "node:net";
import { isUnderDomain, normalizeDomain } from "../evidence/source-tier.js";

export type TargetCheck =
  { ok: true; url: URL } | { ok: false; reason: string };

/**
 * Accepts only what the probe may contact. The DNS check (public addresses only) comes later,
 * in probeUrl; this part needs no network.
 */
export function checkTarget(raw: string, officialDomain: string): TargetCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "not_https" };
  }
  if (url.port !== "" && url.port !== "443") {
    return { ok: false, reason: "port_not_443" };
  }
  if (url.username !== "" || url.password !== "") {
    return { ok: false, reason: "has_credentials" };
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (isIP(host) !== 0) {
    return { ok: false, reason: "ip_literal" };
  }
  if (!isUnderDomain(host.toLowerCase(), normalizeDomain(officialDomain))) {
    return { ok: false, reason: "not_official_domain" };
  }
  return { ok: true, url };
}
