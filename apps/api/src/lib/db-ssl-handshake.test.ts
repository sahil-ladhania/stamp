/**
 * File: db-ssl-handshake.test.ts
 * Purpose: Proves, with the real mariadb connector against a local server that speaks just enough MySQL, that DB_SSL_CA reaches the TLS handshake: a certificate signed by the CA in DB_SSL_CA is accepted, and one signed by another CA, or checked with no CA, is refused. No database is contacted.
 * Exports: (none)
 * Used by: vitest
 */
import * as mariadb from "mariadb";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDatabaseConfig } from "../config.js";
import { poolConfigFrom } from "./db-pool-config.js";
import {
  haveOpenssl,
  startFakeMysqlTls,
  type FakeMysqlTls,
} from "./fixtures/fake-mysql-tls.js";

const CERTIFICATE_ERROR = /certificate|self.signed|unable to verify|issuer/i;

describe.skipIf(!haveOpenssl())("DB_SSL_CA and the real TLS handshake", () => {
  let fake: FakeMysqlTls;
  beforeAll(async () => {
    fake = await startFakeMysqlTls();
  });
  afterAll(() => fake.close());

  /** Connects the way the app does: DATABASE_URL and DB_SSL_CA from the environment, through the app's own config code. */
  async function connectWith(ca: string | undefined): Promise<string> {
    fake.reset();
    const env = getDatabaseConfig({
      DATABASE_URL: `mysql://app:pw@127.0.0.1:${fake.port}/stamp?ssl-mode=REQUIRED`,
      ...(ca === undefined ? {} : { DB_SSL_CA: ca }),
    });
    const { config } = poolConfigFrom(env.DATABASE_URL, env.DB_SSL_CA);
    try {
      await mariadb.createConnection({ ...config, connectTimeout: 5000 });
      return "connected";
    } catch (err) {
      return (err as Error).message;
    }
  }

  it("accepts a server certificate signed by the CA given in DB_SSL_CA", async () => {
    const message = await connectWith(fake.caPem);
    expect(fake.secured()).toBe(1);
    expect(message).not.toMatch(/altnames|self.signed|unable to verify/i);
  });

  it("accepts the same CA pasted on one line with literal \\n, as a dashboard may store it", async () => {
    await connectWith(fake.caPem.trim().replace(/\n/g, "\\n"));
    expect(fake.secured()).toBe(1);
  });

  it("refuses the certificate when DB_SSL_CA is not set, because the system CAs do not know the signer", async () => {
    expect(await connectWith(undefined)).toMatch(CERTIFICATE_ERROR);
    expect(fake.secured()).toBe(0);
  });

  it("refuses the certificate when DB_SSL_CA is some other CA", async () => {
    expect(await connectWith(fake.otherCaPem)).toMatch(CERTIFICATE_ERROR);
    expect(fake.secured()).toBe(0);
  });
});
