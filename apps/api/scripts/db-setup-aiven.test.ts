/**
 * File: db-setup-aiven.test.ts
 * Purpose: Tests scripts/db-setup-aiven.sh on a good run, with a fake pnpm: the URLs it builds, the order of its steps, its confirm step, and that the password never appears in anything it prints.
 * Exports: (none)
 * Used by: vitest
 */
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CA,
  ENCODED,
  HOST,
  PASSWORD,
  useAivenHarness,
} from "./fixtures/aiven-harness.js";

const h = useAivenHarness();

describe("db-setup-aiven.sh", () => {
  it("runs migrate, then the seed dry run, asks, then the real seed, and ends with what to paste into Render", () => {
    const r = h.run([...h.good(), "yes"]);
    expect(r.status).toBe(0);
    expect(r.calls).toEqual([
      "--filter api exec prisma migrate deploy",
      "--filter api db:seed -- --dry-run",
      "--filter api db:seed",
    ]);
    expect(r.out).toContain(`${HOST}:12345`);
    expect(r.out).toContain("defaultdb");
    expect(r.out).toContain("DATABASE_URL = mysql://USER:PASSWORD@");
    expect(r.out).toContain("DB_SSL_CA");
  });

  it("builds the migrate URL with strict TLS and the CA file, and the runtime URL with ssl-mode and the CA text", () => {
    const r = h.run([...h.good(), "yes"]);
    const urls = r.log
      .split("\n")
      .filter((l) => l.startsWith("URL: "))
      .map((l) => l.slice(5));
    expect(urls[0]).toMatch(
      new RegExp(
        `^mysql://avnadmin:${ENCODED.replace(/[$]/g, "\\$")}@${HOST}:12345/defaultdb\\?sslaccept=strict&sslcert=/\\S+/aiven-ca\\.pem$`,
      ),
    );
    expect(urls[1]).toBe(
      `mysql://avnadmin:${ENCODED}@${HOST}:12345/defaultdb?ssl-mode=REQUIRED`,
    );
    expect(urls[2]).toBe(urls[1]);
    expect(r.log).toContain(
      `CA_FILE_TEXT: ${CA.trim().split("\n").join("|")}|`,
    );
    const lengths = r.log
      .split("\n")
      .filter((l) => l.startsWith("CA_LEN: "))
      .map((l) => Number(l.slice(8)));
    expect(lengths).toEqual([0, CA.trim().length, CA.trim().length]);
  });

  it("removes its copy of the CA file when it ends", () => {
    const r = h.run([...h.good(), "yes"]);
    const file = /CA_FILE: (\S+)/.exec(r.log)?.[1] ?? "";
    expect(file).toContain("aiven-ca.pem");
    expect(existsSync(file)).toBe(false);
  });

  it("never prints the password, as typed or as encoded, even when a command prints it, and says so with ***", () => {
    const r = h.run([...h.good(), "yes"]);
    expect(r.out).not.toContain(PASSWORD);
    expect(r.out).not.toContain(ENCODED);
    expect(r.out).not.toContain("Sup3r");
    expect(r.out).toContain("fake pnpm says the password is *** or ***");
  });

  it("does not print the password when run with bash -x either", () => {
    const r = h.run([...h.good(), "yes"], {}, ["-x"]);
    expect(r.out).not.toContain("Sup3r");
  });

  it("tells you to percent-encode special characters in the Render URL, and not otherwise", () => {
    expect(h.run([...h.good(), "yes"]).out).toContain("percent-encoded");
    const plain = h.run([
      HOST,
      "12345",
      "",
      "",
      "PlainPassw0rd",
      h.caFile(),
      "yes",
    ]);
    expect(plain.out).not.toContain("percent-encoded");
  });

  it("accepts a CA path in quotes or with backslashes before spaces, as Terminal pastes it", () => {
    expect(
      h.run([HOST, "12345", "", "", PASSWORD, `'${h.caFile()}'`, "yes"]).status,
    ).toBe(0);
    expect(
      h.run([
        HOST,
        "12345",
        "",
        "",
        PASSWORD,
        h.caFile().replace(/ /g, "\\ "),
        "yes",
      ]).status,
    ).toBe(0);
  });

  it("stops before writing the guides unless you type yes, and says the tables are in place", () => {
    const r = h.run([...h.good(), "y"]);
    expect(r.status).toBe(0);
    expect(r.calls).toHaveLength(2);
    expect(r.out).toContain("Stopped before writing");
  });
});
