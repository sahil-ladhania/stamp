/**
 * File: ip.ts
 * Purpose: Says whether an IP address is on the public internet; the probe only talks to hosts that resolve to public addresses.
 * Exports: isPublicIp
 * Used by: agent/probe/probe-url.ts
 */
import { BlockList, isIP } from "node:net";

/** Ranges that are not the public internet (RFC 6890 and friends), IPv4 and IPv6. */
const NON_PUBLIC = new BlockList();
const V4: [string, number][] = [
  ["0.0.0.0", 8], // this network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, including cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, and the broadcast address
];
/** Inside the global unicast block (2000::/3) below, the ranges that are not the public internet. */
const V6: [string, number][] = [
  ["2001::", 23], // protocol assignments, Teredo, deprecated ORCHID
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 (embeds an IPv4 address)
  ["3fff::", 20], // documentation
];
V4.forEach(([net, prefix]) => NON_PUBLIC.addSubnet(net, prefix, "ipv4"));
V6.forEach(([net, prefix]) => NON_PUBLIC.addSubnet(net, prefix, "ipv6"));

/**
 * Global unicast IPv6, the only block handed out for the public internet today. Everything outside it
 * (loopback, link-local, unique local, multicast, NAT64, IPv4-mapped) is refused by not being in it.
 */
const GLOBAL_V6 = new BlockList();
GLOBAL_V6.addSubnet("2000::", 3, "ipv6");

/**
 * True only for an address that is on the public internet. Text that is not an IP address is false.
 * An IPv4 address written in IPv6 form (::ffff:8.8.8.8) is refused, public or not: a resolver never returns one,
 * and it is a common way to hide a private address.
 */
export function isPublicIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    return !NON_PUBLIC.check(address, "ipv4");
  }
  if (version === 6) {
    return (
      GLOBAL_V6.check(address, "ipv6") && !NON_PUBLIC.check(address, "ipv6")
    );
  }
  return false;
}
