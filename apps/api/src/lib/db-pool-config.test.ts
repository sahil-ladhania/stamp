/**
 * File: db-pool-config.test.ts
 * Purpose: Tests the database pool options: no TLS for a plain URL (local MySQL), TLS for the ssl-mode values that ask for it, the optional CA from DB_SSL_CA, and clear errors that never print the URL or the certificate.
 * Exports: (none)
 * Used by: vitest
 */
import { describe, expect, it } from "vitest";
import { poolConfigFrom } from "./db-pool-config.js";

const CA = [
  "-----BEGIN CERTIFICATE-----",
  "MIIBfakefakefakefakefakefakefakefakefakefakefakefake",
  "-----END CERTIFICATE-----",
].join("\n");
const BASE = "mysql://app:s3cret%40pw@db.example.com:12345/stamp";

describe("poolConfigFrom without TLS", () => {
  it("reads host, port, user, password and database, and keeps the connection limit", () => {
    const { config, tls } = poolConfigFrom(BASE);
    expect(config).toEqual({
      host: "db.example.com",
      port: 12345,
      user: "app",
      password: "s3cret@pw",
      database: "stamp",
      connectionLimit: 5,
    });
    expect(tls).toBe("off");
  });

  it("uses port 3306 when the URL has none, and sets no ssl for a local MySQL", () => {
    const { config } = poolConfigFrom("mysql://root:root@localhost/stamp_dev");
    expect(config.port).toBe(3306);
    expect(config).not.toHaveProperty("ssl");
  });

  it.each(["DISABLED", "disabled", "PREFERRED"])(
    "sets no ssl for ssl-mode=%s",
    (mode) => {
      const { config, tls } = poolConfigFrom(`${BASE}?ssl-mode=${mode}`, CA);
      expect(config).not.toHaveProperty("ssl");
      expect(tls).toBe("off");
    },
  );

  it("does not use a CA when the URL does not ask for TLS", () => {
    expect(poolConfigFrom(BASE, CA).config).not.toHaveProperty("ssl");
  });
});

describe("poolConfigFrom with TLS", () => {
  it.each(["REQUIRED", "required", "VERIFY_CA", "VERIFY_IDENTITY"])(
    "checks the server certificate against the system CAs for ssl-mode=%s without a CA",
    (mode) => {
      const { config, tls } = poolConfigFrom(`${BASE}?ssl-mode=${mode}`);
      expect(config.ssl).toBe(true);
      expect(tls).toBe("verified with system CAs");
    },
  );

  it("checks the certificate against DB_SSL_CA when it is set", () => {
    const { config, tls } = poolConfigFrom(`${BASE}?ssl-mode=REQUIRED`, CA);
    expect(config.ssl).toEqual({ ca: CA, rejectUnauthorized: true });
    expect(tls).toBe("verified with DB_SSL_CA");
  });

  it("never turns certificate checking off", () => {
    for (const ca of [undefined, CA]) {
      const { ssl } = poolConfigFrom(`${BASE}?ssl-mode=REQUIRED`, ca).config;
      expect(
        ssl === true ||
          (typeof ssl === "object" && ssl.rejectUnauthorized === true),
      ).toBe(true);
    }
  });

  it("takes a CA pasted with literal \\n instead of line breaks, and trims it", () => {
    const flat = `  ${CA.replace(/\n/g, "\\n")}  `;
    expect(
      poolConfigFrom(`${BASE}?ssl-mode=REQUIRED`, flat).config.ssl,
    ).toEqual({
      ca: CA,
      rejectUnauthorized: true,
    });
  });

  it("keeps other query parameters from changing the result", () => {
    const { config } = poolConfigFrom(
      `${BASE}?connection_limit=9&ssl-mode=REQUIRED`,
    );
    expect(config.connectionLimit).toBe(5);
    expect(config.ssl).toBe(true);
  });
});

describe("poolConfigFrom errors", () => {
  it("refuses an ssl-mode it does not know, instead of connecting without TLS, and lists the allowed ones", () => {
    expect(() => poolConfigFrom(`${BASE}?ssl-mode=REQUIRD`)).toThrow(
      /REQUIRD.*DISABLED, PREFERRED, REQUIRED, VERIFY_CA, VERIFY_IDENTITY/,
    );
  });

  it("refuses a CA that is not a PEM certificate, and does not print it", () => {
    const bad = "this-is-not-a-certificate-s3cret-text";
    let message = "";
    try {
      poolConfigFrom(`${BASE}?ssl-mode=REQUIRED`, bad);
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toMatch(/DB_SSL_CA is not a PEM certificate/);
    expect(message).not.toContain(bad);
  });

  it("does not put the password or the URL in an error", () => {
    let message = "";
    try {
      poolConfigFrom(`${BASE}?ssl-mode=NOPE`);
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).not.toContain("s3cret");
    expect(message).not.toContain("db.example.com");
  });
});
