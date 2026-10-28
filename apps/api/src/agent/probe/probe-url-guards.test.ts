/**
 * File: probe-url-guards.test.ts
 * Purpose: Tests the probe's SSRF guards with a mocked fetch and DNS: nothing is sent to a refused target or a non-public address.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { URL1, io, run } from "../../test-support/probe-io.js";

describe("probeUrl: SSRF guards", () => {
  it.each([
    ["http://acme.com/oauth/authorize", "not_https"],
    ["https://acme.com:8443/oauth/authorize", "port_not_443"],
    ["https://evil.com/oauth/authorize", "not_official_domain"],
    ["https://acme.com.evil.com/oauth/authorize", "not_official_domain"],
    ["https://169.254.169.254/latest/meta-data", "ip_literal"],
    ["https://user:pw@acme.com/oauth/authorize", "has_credentials"],
  ])("sends nothing and looks nothing up for %s", async (url, reason) => {
    const rig = io();
    expect(await run(rig, url)).toEqual({
      outcome: "skipped",
      status: null,
      reason,
    });
    expect(rig.calls).not.toHaveBeenCalled();
    expect(rig.lookups).not.toHaveBeenCalled();
  });

  it.each([
    ["a private address", ["10.0.0.5"]],
    ["loopback", ["127.0.0.1"]],
    ["link-local", ["169.254.169.254"]],
    ["IPv6 loopback", ["::1"]],
    [
      "a public and a private address together",
      ["93.184.216.34", "192.168.0.9"],
    ],
    ["nothing", []],
  ])("sends nothing when the host resolves to %s", async (_name, addresses) => {
    const rig = io(undefined, addresses);
    expect(await run(rig)).toEqual({
      outcome: "skipped",
      status: null,
      reason: "non_public_address",
    });
    expect(rig.calls).not.toHaveBeenCalled();
  });

  it("fails without sending when the lookup fails", async () => {
    const rig = io();
    rig.lookups.mockRejectedValueOnce(new Error("ENOTFOUND"));
    expect(await run(rig)).toEqual({
      outcome: "failed",
      status: null,
      reason: "network_error",
    });
    expect(rig.calls).not.toHaveBeenCalled();
  });

  it("fails without sending when the lookup is too slow", async () => {
    const rig = io();
    rig.lookups.mockReturnValueOnce(new Promise(() => undefined));
    expect(await run(rig, URL1, 20)).toEqual({
      outcome: "failed",
      status: null,
      reason: "timeout",
    });
    expect(rig.calls).not.toHaveBeenCalled();
  });
});
