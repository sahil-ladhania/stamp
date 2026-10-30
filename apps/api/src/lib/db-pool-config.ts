/**
 * File: db-pool-config.ts
 * Purpose: Turns DATABASE_URL (and the optional DB_SSL_CA) into the pool options of the MariaDB adapter, including TLS when the URL asks for it (Aiven's `?ssl-mode=REQUIRED`).
 * Exports: poolConfigFrom, SSL_MODES, PoolConfig, DbTls
 * Used by: lib/prisma.ts
 */
import type { PoolConfig } from "mariadb";

export type { PoolConfig };

/** How the connection is secured, for one log line: never a secret. */
export type DbTls =
  "off" | "verified with DB_SSL_CA" | "verified with system CAs";

const CONNECTION_LIMIT = 5;

/**
 * The MySQL client `ssl-mode` values. Off: no TLS (local MySQL). On: TLS, and the server's certificate is checked,
 * with the CA from DB_SSL_CA when it is set, or else with the CAs that Node trusts. There is no mode that encrypts
 * without checking: a server whose CA is not trusted is refused, never accepted unchecked.
 */
export const SSL_MODES: Readonly<Record<string, boolean>> = {
  DISABLED: false,
  PREFERRED: false,
  REQUIRED: true,
  VERIFY_CA: true,
  VERIFY_IDENTITY: true,
};

const CERTIFICATE =
  /-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----/;

/** A PEM pasted into a single-line field often arrives with literal "\n" instead of line breaks. */
function normalizePem(pem: string): string {
  const text = pem.includes("\n") ? pem : pem.replace(/\\n/g, "\n");
  return text.trim();
}

function sslWanted(url: URL): boolean {
  const raw = url.searchParams.get("ssl-mode");
  if (raw === null) return false;
  const wanted = SSL_MODES[raw.trim().toUpperCase()];
  if (wanted === undefined) {
    throw new Error(
      `DATABASE_URL has ssl-mode=${raw}, which is not one of ${Object.keys(SSL_MODES).join(", ")}`,
    );
  }
  return wanted;
}

/**
 * Splits DATABASE_URL into pool options so the connection limit can be set. No `ssl-mode` in the URL means no TLS, so a
 * local MySQL works as before. A CA given without `ssl-mode` is not used. Messages never include the URL or the CA.
 */
export function poolConfigFrom(
  databaseUrl: string,
  sslCa?: string,
): { config: PoolConfig; tls: DbTls } {
  const url = new URL(databaseUrl);
  const base: PoolConfig = {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: CONNECTION_LIMIT,
  };
  if (!sslWanted(url)) {
    return { config: base, tls: "off" };
  }
  if (sslCa === undefined) {
    return { config: { ...base, ssl: true }, tls: "verified with system CAs" };
  }
  const ca = normalizePem(sslCa);
  if (!CERTIFICATE.test(ca)) {
    throw new Error(
      "DB_SSL_CA is not a PEM certificate: paste the whole CA, from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE-----",
    );
  }
  return {
    config: { ...base, ssl: { ca, rejectUnauthorized: true } },
    tls: "verified with DB_SSL_CA",
  };
}
