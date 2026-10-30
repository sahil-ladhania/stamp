/**
 * File: aiven-harness.ts
 * Purpose: A fake pnpm and a runner for scripts/db-setup-aiven.sh: it records what each call received, prints the password so masking can be tested, and fails on request.
 * Exports: useAivenHarness, HOST, PASSWORD, ENCODED, CA, Result
 * Used by: scripts/db-setup-aiven*.test.ts
 */
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll } from "vitest";

const SCRIPT = fileURLToPath(
  new URL("../../../../scripts/db-setup-aiven.sh", import.meta.url),
);
export const HOST = "mysql-test.aivencloud.com";
export const PASSWORD = "Sup3r$ecret@pw/#1%x";
export const ENCODED = "Sup3r%24ecret%40pw%2F%231%25x";
export const CA =
  "-----BEGIN CERTIFICATE-----\nMIIBfakefakefake\n-----END CERTIFICATE-----\n";

// Records each call (arguments, the URL, the CA text, the CA file the URL names), prints the secret, and fails on request.
const FAKE_PNPM = `#!/usr/bin/env bash
{
  echo "CALL: $*"
  echo "URL: \${DATABASE_URL:-}"
  echo "CA_LEN: \${#DB_SSL_CA}"
  if [[ "\${DATABASE_URL:-}" =~ sslcert=([^&]+) ]]; then echo "CA_FILE: \${BASH_REMATCH[1]}"; echo "CA_FILE_TEXT: $(cat "\${BASH_REMATCH[1]}" | tr '\\n' '|')"; fi
} >> "$FAKE_LOG"
echo "fake pnpm says the password is $FAKE_SECRET_RAW or $FAKE_SECRET_ENC"
kind=other
case "$*" in *migrate*) kind=migrate ;; *--dry-run*) kind=dryrun ;; *db:seed*) kind=seed ;; esac
if [ "$FAKE_FAIL" = "$kind" ] || { [ "$FAKE_FAIL" = "migrate-strict" ] && [ "$kind" = migrate ] && [[ "$DATABASE_URL" == *sslaccept=strict* ]]; }; then
  echo "$FAKE_MSG"
  exit 1
fi
`;

export type Result = {
  status: number | null;
  out: string;
  calls: string[];
  log: string;
};

/** Registers the setup and cleanup for a test file, and returns the runner. The CA file is made once per file. */
export function useAivenHarness() {
  let dir = "";
  let caFile = "";
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "aiven-test-"));
    writeFileSync(join(dir, "pnpm"), FAKE_PNPM);
    chmodSync(join(dir, "pnpm"), 0o755);
    caFile = join(dir, "ca with space.pem");
    writeFileSync(caFile, CA);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  function run(
    answers: string[],
    fake: Record<string, string> = {},
    bashArgs: string[] = [],
  ): Result {
    const log = join(dir, `calls-${Math.random().toString(36).slice(2)}.log`);
    writeFileSync(log, "");
    const result = spawnSync("bash", [...bashArgs, SCRIPT], {
      input: `${answers.join("\n")}\n`,
      encoding: "utf8",
      env: {
        PATH: `${dir}:${process.env.PATH ?? ""}`,
        HOME: process.env.HOME ?? "",
        FAKE_LOG: log,
        FAKE_SECRET_RAW: PASSWORD,
        FAKE_SECRET_ENC: ENCODED,
        FAKE_FAIL: "",
        FAKE_MSG: "",
        ...fake,
      },
    });
    const text = readFileSync(log, "utf8");
    return {
      status: result.status,
      out: `${result.stdout}\n${result.stderr}`,
      calls: text
        .split("\n")
        .filter((line) => line.startsWith("CALL: "))
        .map((line) => line.slice(6)),
      log: text,
    };
  }

  return {
    run,
    dir: () => dir,
    caFile: () => caFile,
    /** The answers to the first questions, valid: evaluated per test, because the CA file is made in beforeAll. */
    good: (): string[] => [HOST, "12345", "", "", PASSWORD, caFile],
  };
}
