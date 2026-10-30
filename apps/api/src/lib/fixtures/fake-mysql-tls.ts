/**
 * File: fake-mysql-tls.ts
 * Purpose: A local server that speaks just enough of the MySQL protocol to offer TLS and complete the handshake with a test certificate, and the openssl calls that make a test CA, a server certificate it signed, and a second, unrelated CA.
 * Exports: haveOpenssl, startFakeMysqlTls, FakeMysqlTls
 * Used by: lib/db-ssl-handshake.test.ts
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import { Duplex } from "node:stream";
import { tmpdir } from "node:os";
import { join } from "node:path";
import tls from "node:tls";

export function haveOpenssl(): boolean {
  try {
    execFileSync("openssl", ["version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const CA_CNF = `[req]
distinguished_name=dn
x509_extensions=v3_ca
prompt=no
[dn]
CN=Test CA
[v3_ca]
basicConstraints=critical,CA:TRUE
keyUsage=critical,keyCertSign,cRLSign
`;
const SAN_CNF =
  "subjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=CA:FALSE\n";
/** The client's "I want TLS" packet: a 4-byte header and 32 bytes. Its TLS hello follows at once. */
const SSL_REQUEST_BYTES = 4 + 32;

/** The first packet a MySQL server sends: protocol 10, and capability flags that say TLS is available. */
function handshakePacket(): Buffer {
  const payload = Buffer.concat([
    Buffer.from([10]),
    Buffer.from("8.0.0-test\0"),
    Buffer.from([1, 0, 0, 0]),
    Buffer.alloc(8, 1),
    Buffer.from([0]),
    Buffer.from([0x0d, 0xaa]), // capabilities, low half: protocol 4.1, secure connection, SSL, connect with db
    Buffer.from([45]),
    Buffer.from([2, 0]),
    Buffer.from([0x08, 0x00]), // capabilities, high half: plugin auth
    Buffer.from([21]),
    Buffer.alloc(10),
    Buffer.alloc(12, 2),
    Buffer.from([0]),
    Buffer.from("mysql_native_password\0"),
  ]);
  const length = payload.length;
  const header = Buffer.from([
    length & 0xff,
    (length >> 8) & 0xff,
    (length >> 16) & 0xff,
    0,
  ]);
  return Buffer.concat([header, payload]);
}

export type FakeMysqlTls = {
  /** The CA that signed the server's certificate. */
  caPem: string;
  /** A different CA, which did not. */
  otherCaPem: string;
  port: number;
  /** How many TLS handshakes the server finished since the last reset. */
  secured: () => number;
  reset: () => void;
  close: () => Promise<void>;
};

export async function startFakeMysqlTls(): Promise<FakeMysqlTls> {
  const dir = mkdtempSync(join(tmpdir(), "db-tls-"));
  const run = (args: string[]) =>
    execFileSync("openssl", args, { cwd: dir, stdio: "ignore" });
  writeFileSync(join(dir, "ca.cnf"), CA_CNF);
  writeFileSync(join(dir, "san.cnf"), SAN_CNF);
  for (const name of ["ca", "other"]) {
    run([
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      `${name}.key`,
      "-out",
      `${name}.pem`,
      "-days",
      "2",
      "-config",
      "ca.cnf",
    ]);
  }
  run([
    "req",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    "srv.key",
    "-out",
    "srv.csr",
    "-subj",
    "/CN=localhost",
  ]);
  run([
    "x509",
    "-req",
    "-in",
    "srv.csr",
    "-CA",
    "ca.pem",
    "-CAkey",
    "ca.key",
    "-CAcreateserial",
    "-out",
    "srv.pem",
    "-days",
    "2",
    "-extfile",
    "san.cnf",
  ]);
  const key = readFileSync(join(dir, "srv.key"));
  const cert = readFileSync(join(dir, "srv.pem"));
  const caPem = readFileSync(join(dir, "ca.pem"), "utf8");
  const otherCaPem = readFileSync(join(dir, "other.pem"), "utf8");

  let secured = 0;
  const server = net.createServer((socket) => {
    socket.on("error", () => {});
    socket.write(handshakePacket());
    // The first 36 bytes are dropped; every byte after them goes to a TLS socket built on this stream.
    let skipped = 0;
    const toTls = new Duplex({
      read() {},
      write(chunk: Buffer, _encoding, done) {
        socket.write(chunk, done);
      },
    });
    const secure = new tls.TLSSocket(toTls, { isServer: true, key, cert });
    secure.on("error", () => {});
    secure.on("secure", () => {
      secured += 1;
      // The handshake is the whole test: close the connection so the client's attempt ends at once.
      secure.destroy();
      socket.destroy();
    });
    socket.on("data", (chunk: Buffer) => {
      const drop = Math.min(SSL_REQUEST_BYTES - skipped, chunk.length);
      skipped += drop;
      if (chunk.length > drop) toTls.push(chunk.subarray(drop));
    });
    socket.on("close", () => toTls.destroy());
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    caPem,
    otherCaPem,
    port: (server.address() as net.AddressInfo).port,
    secured: () => secured,
    reset: () => {
      secured = 0;
    },
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
