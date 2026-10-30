#!/usr/bin/env bash
# File: db-setup-aiven.sh
# Purpose: Sets up the production database on Aiven MySQL from your own machine: asks for the connection details (the
#          password with a hidden prompt), builds both URLs, runs `prisma migrate deploy`, then `db:seed --dry-run`, asks
#          you to confirm, then the real seed.
# Run:     bash scripts/db-setup-aiven.sh      (from anywhere; it finds the repo)
# Secrets: The password is never printed, never put on a command line, and never written to a file: it lives in this
#          script's memory and in the environment of the commands it starts. Output of those commands is filtered so a
#          password that appears in it shows as ***. The CA file is public and is copied to a private temp folder.

set +x
unset BASH_XTRACEFD
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

# A private folder for the CA copy and the step logs, removed on exit.
TMP="$(mktemp -d "/tmp/aiven-setup.XXXXXX")" || { echo "Cannot make a temp folder."; exit 1; }
chmod 700 "$TMP"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT
trap 'echo; echo "Stopped."; exit 130' INT TERM

say() { printf '%s\n' "$*"; }
stop() {
  # stop "what failed" "likely fix line" ...
  say ""
  say "STOP: $1"
  shift
  for line in "$@"; do say "  Likely fix: $line"; done
  exit 1
}

# --- 0. Tools ------------------------------------------------------------------------------------------------------
command -v node >/dev/null 2>&1 || stop "node is not installed or not on PATH." "install Node (the repo asks for version 24 or later), then run this again."
command -v pnpm >/dev/null 2>&1 || stop "pnpm is not installed or not on PATH." "install pnpm (the repo uses pnpm 11), then run this again."
[ -f "$ROOT/apps/api/prisma/schema.prisma" ] || stop "this is not the Stamp repo (apps/api/prisma/schema.prisma is missing)." "run the script from a checkout of the repo."

# --- 1. Ask --------------------------------------------------------------------------------------------------------
ask() {
  # ask VARNAME "prompt" "default"
  local reply
  if [ -n "${3:-}" ]; then read -r -p "$2 [$3]: " reply; else read -r -p "$2: " reply; fi
  reply="${reply#"${reply%%[![:space:]]*}"}"
  reply="${reply%"${reply##*[![:space:]]}"}"
  [ -z "$reply" ] && reply="${3:-}"
  printf -v "$1" '%s' "$reply"
}

say "Aiven MySQL setup. Nothing you type here is saved. Find these in the Aiven console: your service, Overview, Connection information."
say ""
ask HOST "Host (like mysql-xxxx.aivencloud.com)"
ask PORT "Port"
ask DBUSER "User" "avnadmin"
ask DBNAME "Database name" "defaultdb"
read -r -s -p "Password (hidden): " PASS
say ""
ask CA_INPUT "Path to the downloaded CA certificate file (drag the file here)"

# --- 2. Check what was typed ---------------------------------------------------------------------------------------
case "$HOST" in
  "" | *://* | */* | *@* | *" "* | *:*) stop "the host should be only the host name, like mysql-xxxx.aivencloud.com (no mysql://, no port, no user)." "copy the Host field from Aiven's Connection information." ;;
esac
case "$PORT" in
  "" | *[!0-9]*) stop "the port must be a number." "copy the Port field from Aiven's Connection information." ;;
esac
[ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ] || stop "the port must be between 1 and 65535." "copy the Port field from Aiven's Connection information."
[ -n "$DBUSER" ] || stop "the user is empty." "Aiven's default user is avnadmin."
case "$DBNAME" in
  "" | *[!A-Za-z0-9_\$-]*) stop "the database name has characters this script does not accept." "use letters, digits, _ or - (Aiven's default is defaultdb)." ;;
esac
[ -n "$PASS" ] || stop "the password is empty." "in Aiven's Connection information, click the eye icon next to Password and copy it."

# A file dragged into Terminal arrives quoted or with backslashes before spaces; ~ is not expanded in a read.
CA_PATH="${CA_INPUT#\'}"; CA_PATH="${CA_PATH%\'}"; CA_PATH="${CA_PATH#\"}"; CA_PATH="${CA_PATH%\"}"
CA_PATH="${CA_PATH//\\ / }"
case "$CA_PATH" in "~"/*) CA_PATH="$HOME/${CA_PATH#"~/"}" ;; esac
[ -f "$CA_PATH" ] || stop "there is no file at the CA path you gave." "download the CA certificate from Aiven (Connection information, CA certificate, Download) and give its full path."
grep -q -- "-----BEGIN CERTIFICATE-----" "$CA_PATH" || stop "that file is not a PEM certificate (it has no BEGIN CERTIFICATE line)." "use the CA certificate file Aiven offers as ca.pem, not the service URI or a key file."

# A private copy with a path that has no spaces, so the migrate URL can name it safely.
CA_COPY="$TMP/aiven-ca.pem"
cp "$CA_PATH" "$CA_COPY" && chmod 600 "$CA_COPY"

# --- 3. Build both URLs ---------------------------------------------------------------------------------------------
# The password may hold characters that mean something in a URL, so it is percent-encoded. It goes to node by
# environment, never on a command line.
ENC_PASS="$(AIVEN_V="$PASS" node -e 'process.stdout.write(encodeURIComponent(process.env.AIVEN_V))')"
ENC_USER="$(AIVEN_V="$DBUSER" node -e 'process.stdout.write(encodeURIComponent(process.env.AIVEN_V))')"
[ -n "$ENC_PASS" ] || stop "could not prepare the password." "check that node works: node --version."
SPECIAL="no"; [ "$ENC_PASS" != "$PASS" ] && SPECIAL="yes"

MIGRATE_URL="mysql://${ENC_USER}:${ENC_PASS}@${HOST}:${PORT}/${DBNAME}?sslaccept=strict&sslcert=${CA_COPY}"
MIGRATE_URL_UNCHECKED="mysql://${ENC_USER}:${ENC_PASS}@${HOST}:${PORT}/${DBNAME}?sslaccept=accept_invalid_certs"
RUNTIME_URL="mysql://${ENC_USER}:${ENC_PASS}@${HOST}:${PORT}/${DBNAME}?ssl-mode=REQUIRED"
CA_TEXT="$(cat "$CA_COPY")"

say ""
say "Target: $HOST:$PORT, database $DBNAME. TLS is checked against your CA file."

# --- 4. Steps ------------------------------------------------------------------------------------------------------
LOG="$TMP/step.log"
mask() {
  # Shows the output, with the password (as typed and as encoded) replaced by ***.
  AIVEN_M1="$PASS" AIVEN_M2="$ENC_PASS" node -e '
    const rl = require("readline").createInterface({ input: process.stdin, crlfDelay: Infinity });
    const secrets = [process.env.AIVEN_M1, process.env.AIVEN_M2].filter(Boolean);
    rl.on("line", (line) => { for (const s of secrets) line = line.split(s).join("***"); console.log(line); });
  '
}
# run_step "url to use" "ca text or empty" command...   Output is filtered and also kept in $LOG for the hints.
run_step() {
  local url="$1" ca="$2"; shift 2
  ( export DATABASE_URL="$url"; if [ -n "$ca" ]; then export DB_SSL_CA="$ca"; else unset DB_SSL_CA; fi
    "$@" 2>&1 ) | mask | tee "$LOG"
  return "${PIPESTATUS[0]}"
}

hints() {
  # Likely fixes, picked from the words in the last step's output.
  local shown=0
  if grep -qiE "access denied|authentication failed|P1000|using password" "$LOG"; then
    say "  Likely fix: the user or password was refused. In Aiven's Connection information, click the eye icon to show the password and copy it again, and check the user name (avnadmin by default)."; shown=1
  fi
  if grep -qiE "unable to verify|self.signed|CERT_|certificate|UNABLE_TO_VERIFY|issuer" "$LOG"; then
    say "  Likely fix: the CA file is not the one for this service, or it is out of date. Download the CA certificate again from this service's Connection information (each Aiven project has its own) and run this again."; shown=1
  fi
  if grep -qiE "ECONNREFUSED|ETIMEDOUT|timed out|timeout|ENOTFOUND|EAI_AGAIN|P1001|can't reach|cannot reach|ECONNRESET" "$LOG"; then
    say "  Likely fix: the database could not be reached. Check the host and port, that the service shows Running (not Powered off) in the Aiven console, and that your current IP address is allowed (service, Overview, Allowed IP addresses)."; shown=1
  fi
  if grep -qiE "unknown database|P1003|does not exist" "$LOG"; then
    say "  Likely fix: that database name does not exist on the service. Aiven's default is defaultdb."; shown=1
  fi
  if grep -qiE "P3009|P3018|failed migration|P3005" "$LOG"; then
    say "  Likely fix: an earlier migration is recorded as failed or the database is not empty. Do not edit it by hand: tell me what the output above says."; shown=1
  fi
  [ "$shown" -eq 1 ] || say "  Likely fix: read the message above. If it names a host, port, user or database, check that field in Aiven's Connection information."
}

say ""
say "Step 1 of 3: prisma migrate deploy (creates the tables)"
run_step "$MIGRATE_URL" "" pnpm --filter api exec prisma migrate deploy
if [ "$?" -ne 0 ]; then
  say ""
  say "STOP: prisma migrate deploy failed."
  hints
  if grep -qiE "unable to verify|self.signed|CERT_|certificate|UnknownIssuer|verify failed|issuer" "$LOG"; then
    say ""
    say "  If you are sure your CA file is right, Prisma may not accept the strict TLS form. A one-off migrate from your own machine can use"
    say "  an encrypted connection whose certificate is NOT checked. The app itself will still check it (step 2 and Render)."
    read -r -p "  Retry the migrate with the certificate not checked? [y/N]: " RETRY
    [ "$RETRY" = "y" ] || [ "$RETRY" = "Y" ] || exit 1
    run_step "$MIGRATE_URL_UNCHECKED" "" pnpm --filter api exec prisma migrate deploy
    if [ "$?" -ne 0 ]; then say ""; say "STOP: the retry failed too."; hints; exit 1; fi
  else
    exit 1
  fi
fi

say ""
say "Step 2 of 3: check the library guides (db:seed --dry-run, no connection is opened)"
run_step "$RUNTIME_URL" "$CA_TEXT" pnpm --filter api db:seed -- --dry-run
if [ "$?" -ne 0 ]; then say ""; say "STOP: the dry run failed. Nothing was written."; hints; exit 1; fi

say ""
read -r -p "Write the library guides to $HOST, database $DBNAME? Type yes to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then say "Stopped before writing the guides. The tables from step 1 are in place; run the script again to seed."; exit 0; fi

say ""
say "Step 3 of 3: db:seed (writes the library guides)"
run_step "$RUNTIME_URL" "$CA_TEXT" pnpm --filter api db:seed
if [ "$?" -ne 0 ]; then
  say ""; say "STOP: the seed failed."; hints
  say "  Note: the app checks the certificate against your CA file. If the migrate only worked with the unchecked retry, the CA file is the problem."
  exit 1
fi

# --- 5. Done -------------------------------------------------------------------------------------------------------
say ""
say "Done. $HOST:$PORT, database $DBNAME has its tables and the library guides."
say ""
say "Paste these into Render (Environment). Type the password yourself; nothing here shows it:"
say "  DATABASE_URL = mysql://USER:PASSWORD@$HOST:$PORT/$DBNAME?ssl-mode=REQUIRED"
say "                 (USER is your Aiven user, avnadmin by default)"
say "  DB_SSL_CA    = the whole text of the CA file, from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE-----"
say "                 (copy it with:  pbcopy < \"$CA_PATH\" )"
if [ "$SPECIAL" = "yes" ]; then
  say ""
  say "Your password has special characters. In DATABASE_URL write them percent-encoded: @ as %40, / as %2F, : as %3A, # as %23,"
  say "? as %3F, % as %25, and a space as %20. (Render's other fields take the password as it is.)"
fi
exit 0
