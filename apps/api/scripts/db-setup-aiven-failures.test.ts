/**
 * File: db-setup-aiven-failures.test.ts
 * Purpose: Tests scripts/db-setup-aiven.sh when a step fails (the hints, the certificate retry, nothing written after a failed dry run) and when what is typed is wrong (nothing is run).
 * Exports: (none)
 * Used by: vitest
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HOST, PASSWORD, useAivenHarness } from "./fixtures/aiven-harness.js";

const h = useAivenHarness();

describe("db-setup-aiven.sh when a step fails", () => {
  it("stops at a refused password, with the likely fix, and runs nothing more", () => {
    const r = h.run(h.good(), {
      FAKE_FAIL: "migrate",
      FAKE_MSG: "Error: Access denied for user 'avnadmin'",
    });
    expect(r.status).toBe(1);
    expect(r.calls).toHaveLength(1);
    expect(r.out).toContain("STOP: prisma migrate deploy failed");
    expect(r.out).toMatch(/Likely fix: the user or password was refused/);
  });

  it("stops at an unreachable host with the hint about the service state and the allowed IP addresses", () => {
    const r = h.run(h.good(), {
      FAKE_FAIL: "migrate",
      FAKE_MSG: "Error: P1001: Can't reach database server",
    });
    expect(r.status).toBe(1);
    expect(r.out).toMatch(
      /Likely fix: the database could not be reached.*Allowed IP addresses/,
    );
  });

  it("offers an unchecked-certificate retry for a certificate error, and stops when you decline", () => {
    const r = h.run([...h.good(), "n"], {
      FAKE_FAIL: "migrate",
      FAKE_MSG: "error: self-signed certificate in certificate chain",
    });
    expect(r.status).toBe(1);
    expect(r.calls).toHaveLength(1);
    expect(r.out).toMatch(/CA file is not the one for this service/);
    // The question itself is a read prompt, which shows only on a terminal; the text before it always shows.
    expect(r.out).toContain("certificate is NOT checked");
  });

  it("retries with sslaccept=accept_invalid_certs only when you say y, then carries on", () => {
    const r = h.run([...h.good(), "y", "yes"], {
      FAKE_FAIL: "migrate-strict",
      FAKE_MSG: "error: UnknownIssuer",
    });
    expect(r.status).toBe(0);
    expect(r.calls).toEqual([
      "--filter api exec prisma migrate deploy",
      "--filter api exec prisma migrate deploy",
      "--filter api db:seed -- --dry-run",
      "--filter api db:seed",
    ]);
    const urls = r.log
      .split("\n")
      .filter((l) => l.startsWith("URL: "))
      .map((l) => l.slice(5));
    expect(urls[1]).toContain("sslaccept=accept_invalid_certs");
    expect(urls[1]).not.toContain("sslcert");
  });

  it("does not write the guides when the dry run fails", () => {
    const r = h.run(h.good(), {
      FAKE_FAIL: "dryrun",
      FAKE_MSG: "1 guide fails the library check",
    });
    expect(r.status).toBe(1);
    expect(r.calls).toEqual([
      "--filter api exec prisma migrate deploy",
      "--filter api db:seed -- --dry-run",
    ]);
    expect(r.out).toContain("Nothing was written");
  });

  it("stops with a hint when the real seed fails", () => {
    const r = h.run([...h.good(), "yes"], {
      FAKE_FAIL: "seed",
      FAKE_MSG: "Error: unable to verify the first certificate",
    });
    expect(r.status).toBe(1);
    expect(r.out).toContain("STOP: the seed failed");
    expect(r.out).toMatch(
      /Download the CA certificate again|download the CA certificate again/i,
    );
  });
});

describe("db-setup-aiven.sh checks what is typed before running anything", () => {
  it.each([
    [
      "a host with a scheme",
      ["mysql://" + HOST, "12345", "", "", PASSWORD, "x"],
      /only the host name/,
    ],
    [
      "a port that is not a number",
      [HOST, "abc", "", "", PASSWORD, "x"],
      /port must be a number/,
    ],
    [
      "a port out of range",
      [HOST, "70000", "", "", PASSWORD, "x"],
      /between 1 and 65535/,
    ],
    [
      "an empty password",
      [HOST, "12345", "", "", "", "x"],
      /password is empty/,
    ],
    [
      "a CA path with no file",
      [HOST, "12345", "", "", PASSWORD, "/no/such/ca.pem"],
      /no file at the CA path/,
    ],
  ])("stops for %s, and runs no command", (_label, answers, message) => {
    const r = h.run(answers as string[]);
    expect(r.status).toBe(1);
    expect(r.calls).toHaveLength(0);
    expect(r.out).toMatch(message as RegExp);
    expect(r.out).not.toContain("Sup3r");
  });

  it("stops for a CA file that is not a certificate", () => {
    const notCa = join(h.dir(), "key.pem");
    writeFileSync(
      notCa,
      "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    );
    const r = h.run([HOST, "12345", "", "", PASSWORD, notCa]);
    expect(r.status).toBe(1);
    expect(r.calls).toHaveLength(0);
    expect(r.out).toMatch(/not a PEM certificate/);
  });
});
