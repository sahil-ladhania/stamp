# Deployment: Aiven (MySQL), Render (API), Vercel (web)

Everything here is done by hand in each dashboard. Replace every `UPPER_CASE` placeholder; never commit a real value. Order: Aiven, then migrate and seed from your laptop, then Render, then Vercel, then set `WEB_ORIGIN` on Render to the Vercel address.

## A. Database on Aiven, from your laptop

1. In the Aiven service page, under **Connection information**, note host, port, user (`avnadmin`), password, database (`defaultdb`), and download the **CA certificate** as `aiven-ca.pem`. Check that your own IP is allowed in the service's allowed IP addresses.
2. **Migrate.** `prisma migrate deploy` uses the Prisma engine, which reads TLS settings from its own URL arguments (`sslaccept`, `sslcert`), not from `ssl-mode`:

```bash
DATABASE_URL='mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslaccept=strict&sslcert=/ABSOLUTE/PATH/aiven-ca.pem' \
  pnpm --filter api exec prisma migrate deploy
```

`sslaccept=strict` checks the server's certificate against the CA file in `sslcert`. I could not try this against Aiven (the brief says not to connect to it), so if `migrate deploy` reports a TLS or certificate error, use the fallback below. If Prisma refuses that form, a one-off migration from your own laptop may use `sslaccept=accept_invalid_certs`: encrypted, but the certificate is not checked. A variable set on the command line wins over `apps/api/.env`.

3. **Seed.** `db:seed` runs the API's own database code, which reads `ssl-mode` from the URL and the CA text from `DB_SSL_CA`. Check first (no connection is opened; it prints the target host and database):

```bash
DATABASE_URL='mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED' \
DB_SSL_CA="$(cat /ABSOLUTE/PATH/aiven-ca.pem)" \
  pnpm --filter api db:seed -- --dry-run
```

Then the same command without `-- --dry-run`. It prints `created` or `updated` for the four library guides. Seeding twice is safe.

A password with `@ / : # ?` must be percent-encoded in the URL (`@` becomes `%40`).

**What `DB_SSL_CA` does.** A URL with `ssl-mode=REQUIRED` (or `VERIFY_CA`, `VERIFY_IDENTITY`) turns TLS on and always checks the server's certificate. With `DB_SSL_CA` set, it is checked against that CA. **Without it, it is checked against the CAs Node trusts, and Aiven (which signs with its own CA) is refused**: the API starts, logs `database connection ... tls: verified with system CAs`, and every database call then fails with a certificate error. `/api/health` does not touch the database, so it still answers 200: test `/api/guides` instead. Nothing is ever sent unencrypted or unchecked once `ssl-mode` is in the URL. A URL with no `ssl-mode` (local MySQL) uses no TLS, and `DB_SSL_CA` is ignored. A CA that is not a PEM certificate, or an `ssl-mode` that is misspelled, stops the API at start with a message that never shows the password, the URL or the certificate.

## B. Render (web service)

| Setting           | Value                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Type, instance    | Web Service, Free                                                                                                                            |
| Runtime           | Node                                                                                                                                         |
| Region            | The one nearest the Aiven service                                                                                                            |
| Root Directory    | leave empty (the repo root: the workspace needs it)                                                                                          |
| Build Command     | `npm install -g pnpm@11.25.0 && pnpm install --frozen-lockfile --prod=false && pnpm --filter @stamp/schema build && pnpm --filter api build` |
| Start Command     | `pnpm --filter api start`                                                                                                                    |
| Health Check Path | `/api/health`                                                                                                                                |
| Node version      | environment variable `NODE_VERSION` = `24` (check that the build log says v24)                                                               |

The build installs dev dependencies on purpose (`--prod=false`): `NODE_ENV=production` (section C) is set while Render builds too, and `prisma` (generate) and `tsx` (start) are dev dependencies. `pnpm --filter api build` runs `prisma generate` and then the type check. The free instance sleeps after about 15 minutes without traffic, so the first request after a pause can take 30 seconds or more.

## C. Render environment variables

| Name                        | Value                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `NODE_VERSION`              | `24`                                                                                                               |
| `NODE_ENV`                  | `production`                                                                                                       |
| `AGENT_MODE`                | `real` (required in production)                                                                                    |
| `DATABASE_URL`              | **you paste**: `mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED` (secret)                          |
| `DB_SSL_CA`                 | **you paste**: the whole text of `aiven-ca.pem`, from `-----BEGIN CERTIFICATE-----` to `-----END CERTIFICATE-----` |
| `OPENAI_API_KEY`            | **you paste** (secret)                                                                                             |
| `OPENAI_MODEL_FAST`         | `gpt-4.1-mini`                                                                                                     |
| `OPENAI_MODEL_STRONG`       | `gpt-4.1`                                                                                                          |
| `TAVILY_API_KEY`            | **you paste** (secret)                                                                                             |
| `WEB_ORIGIN`                | `https://YOUR-APP.vercel.app` (the Vercel address; a trailing slash is ignored)                                    |
| `DAILY_RUN_CAP`             | `20` (live runs per day; raise it when you want more)                                                              |
| `ENABLE_BROWSER_AGENT`      | `false`                                                                                                            |
| `TRUST_PROXY_HOPS`          | `1`                                                                                                                |
| `RATE_LIMIT_MAX`            | `10` (optional: this is the default)                                                                               |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` (optional: this is the default)                                                                               |

Do not set `PORT` (Render sets it). `AGENT_PROBE`, `AGENT_RUN_BUDGET_MS` and `AGENT_EXTRACT_CONCURRENCY` keep their defaults.

## D. Vercel

Project settings: Root Directory `apps/web`, framework Vite. `apps/web/vercel.json` carries the install, build and output settings and the rewrite of every path to `index.html`, so a share link such as `/g/hubspot` works on refresh.

| Name                           | Value                                                                       |
| ------------------------------ | --------------------------------------------------------------------------- |
| `VITE_API_URL`                 | `https://YOUR-SERVICE.onrender.com` (the Render address, no trailing slash) |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` (so Vercel uses the `pnpm@11.25.0` the repo asks for)                   |
| `VITE_REPO_URL`                | optional: the repository link for the footer                                |

`VITE_` values are public. Set them for Production and Preview, then redeploy after changing one: Vite reads them at build time.

## Checks after deploying

```bash
curl -s https://YOUR-SERVICE.onrender.com/api/health          # "Server is running...": the API is up
curl -s https://YOUR-SERVICE.onrender.com/api/guides          # the four library guides: the database and TLS work
```

- **CORS:** open the Vercel address; the library list should load. A blocked request in the browser console means `WEB_ORIGIN` is not exactly the Vercel address.
- **The client IP the rate limit sees.** Render's proxy adds the client's address to `X-Forwarded-For`, so `TRUST_PROXY_HOPS=1` makes `req.ip` that address. If another proxy sits in front, `1` would count that proxy for everyone instead. Check it: set `RATE_LIMIT_MAX=2`, then from one network run the command below three times (the third answer is `429`); from a different network (your phone's data) the first answer must **not** be `429`. If it is, set `TRUST_PROXY_HOPS=2`. Set `RATE_LIMIT_MAX` back afterwards. An empty body is rejected with `400` but still counts toward the limit, and starts no run.

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://YOUR-SERVICE.onrender.com/api/runs \
  -H 'Content-Type: application/json' -H 'Origin: https://YOUR-APP.vercel.app' -d '{}'
```

- **The live stream is not buffered or compressed.** The stream route sends `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no` and a comment line every 15 seconds, and the API has no compression middleware. After starting a run from the app, `curl -N -i -H 'Accept-Encoding: gzip' https://YOUR-SERVICE.onrender.com/api/runs/RUN_ID/stream` should show no `Content-Encoding` and events arriving as they happen.
