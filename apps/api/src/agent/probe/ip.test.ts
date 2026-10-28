/**
 * File: ip.test.ts
 * Purpose: Tests the public-address check: private, loopback, link-local and reserved ranges are refused, in IPv4 and IPv6.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { isPublicIp } from "./ip.js";

describe("isPublicIp", () => {
  it.each([
    "8.8.8.8",
    "1.1.1.1",
    "93.184.216.34",
    "172.32.0.1",
    "100.63.255.255",
    "2606:4700:4700::1111",
    "2a00:1450:4001:81b::200e",
  ])("accepts the public address %s", (address) => {
    expect(isPublicIp(address)).toBe(true);
  });

  it.each([
    ["0.0.0.0", "this network"],
    ["10.1.2.3", "private"],
    ["100.64.0.1", "carrier-grade NAT"],
    ["127.0.0.1", "loopback"],
    ["169.254.169.254", "cloud metadata"],
    ["172.16.0.1", "private"],
    ["172.31.255.255", "private"],
    ["192.168.1.1", "private"],
    ["192.0.2.1", "documentation"],
    ["198.18.0.1", "benchmarking"],
    ["224.0.0.1", "multicast"],
    ["255.255.255.255", "broadcast"],
    ["::", "unspecified"],
    ["::1", "loopback"],
    ["fe80::1", "link-local"],
    ["fd12:3456::1", "unique local"],
    ["ff02::1", "multicast"],
    ["2001:db8::1", "documentation"],
    ["3fff::1", "documentation"],
    ["2001::1", "Teredo"],
    ["2002:7f00:1::", "6to4"],
    ["64:ff9b::7f00:1", "NAT64"],
    ["::ffff:127.0.0.1", "IPv4 loopback written as IPv6"],
    ["::ffff:10.0.0.1", "private IPv4 written as IPv6"],
  ])("refuses %s (%s)", (address) => {
    expect(isPublicIp(address)).toBe(false);
  });

  it("refuses a public IPv4 address written as IPv6, which a resolver never returns", () => {
    expect(isPublicIp("::ffff:8.8.8.8")).toBe(false);
  });

  it.each(["", "localhost", "example.com", "999.1.1.1", "1.2.3", "not an ip"])(
    "refuses text that is not an address: %j",
    (text) => {
      expect(isPublicIp(text)).toBe(false);
    },
  );
});
